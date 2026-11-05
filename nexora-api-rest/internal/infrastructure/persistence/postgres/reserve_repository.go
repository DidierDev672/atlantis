package postgres

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"nexora-api-rest/internal/domain"
)

// ReserveSchemaDDL is the schema definition derived 1:1 from domain.Reserve.
const ReserveSchemaDDL = `
CREATE TABLE IF NOT EXISTS reserves (
    id               VARCHAR(36) PRIMARY KEY,
    room_id          VARCHAR(36) NOT NULL,
    person_id        VARCHAR(36) NOT NULL,
    check_in_date    TIMESTAMPTZ NOT NULL,
    check_out_date   TIMESTAMPTZ NOT NULL,
    number_of_guests INT NOT NULL,
    state            VARCHAR(30) NOT NULL DEFAULT 'pending',
    total_price      NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    headquarters_id  VARCHAR(36),
    created_by       VARCHAR(100) NOT NULL DEFAULT '',
    updated_by       VARCHAR(100),
    deleted_by       VARCHAR(100),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,
    CHECK (state IN ('pending', 'confirmed', 'in progress', 'completed', 'canceled', 'no show')),
    CHECK (number_of_guests > 0),
    CHECK (total_price >= 0),
    CHECK (check_out_date > check_in_date)
);
ALTER TABLE reserves ADD COLUMN IF NOT EXISTS headquarters_id VARCHAR(36);
ALTER TABLE reserves ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
ALTER TABLE reserves ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100);
ALTER TABLE reserves ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_reserves_room_id ON reserves(room_id);
CREATE INDEX IF NOT EXISTS idx_reserves_person_id ON reserves(person_id);
CREATE INDEX IF NOT EXISTS idx_reserves_dates ON reserves(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reserves_state ON reserves(state);
`

// ReserveRepository is the Postgres adapter for domain.ReserveRepository.
type ReserveRepository struct {
	conn      *pgxpool.Pool
	initOnce  sync.Once
	initError error
}

// NewReserveRepository instantiates a new ReserveRepository.
func NewReserveRepository(conn *pgxpool.Pool) *ReserveRepository {
	return &ReserveRepository{conn: conn}
}

var _ domain.ReserveRepository = (*ReserveRepository)(nil)

const reserveColumns = "id, room_id, person_id, check_in_date, check_out_date, number_of_guests, state, total_price, created_by, created_at, updated_at"

// EnsureTable creates the reserves table idempotently based on the model if it doesn't exist.
func (r *ReserveRepository) EnsureTable(ctx context.Context) error {
	r.initOnce.Do(func() {
		_, r.initError = r.conn.Exec(ctx, ReserveSchemaDDL)
	})
	return r.initError
}

func scanReserve(row pgx.Row) (domain.Reserve, error) {
	var reserve domain.Reserve
	var stateStr string

	err := row.Scan(
		&reserve.ID,
		&reserve.RoomID,
		&reserve.PersonID,
		&reserve.CheckInDate,
		&reserve.CheckOutDate,
		&reserve.NumberOfGuests,
		&stateStr,
		&reserve.TotalPrice,
		&reserve.CreatedBy,
		&reserve.CreatedAt,
		&reserve.UpdatedAt,
	)
	if err != nil {
		return domain.Reserve{}, err
	}

	reserve.State = domain.ReserveState(stateStr)
	return reserve, nil
}

// FindAll queries all reservations.
func (r *ReserveRepository) FindAll(ctx context.Context) ([]domain.Reserve, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return nil, fmt.Errorf("ensure reserves table: %w", err)
	}

	query := "SELECT " + reserveColumns + " FROM reserves WHERE deleted_at IS NULL"
	var args []any
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		query += " AND (headquarters_id = $1 OR EXISTS (SELECT 1 FROM rooms rm WHERE rm.id = reserves.room_id AND rm.headquarters_id = $1))"
		args = append(args, string(hqID))
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query reserves: %w", err)
	}
	defer rows.Close()

	var reserves []domain.Reserve
	for rows.Next() {
		res, err := scanReserve(rows)
		if err != nil {
			return nil, fmt.Errorf("scan reserve: %w", err)
		}
		reserves = append(reserves, res)
	}

	return reserves, rows.Err()
}

// FindByID retrieves a single reservation by ID.
func (r *ReserveRepository) FindByID(ctx context.Context, id domain.ReserveID) (domain.Reserve, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return domain.Reserve{}, fmt.Errorf("ensure reserves table: %w", err)
	}

	res, err := scanReserve(r.conn.QueryRow(ctx, "SELECT "+reserveColumns+" FROM reserves WHERE id = $1 AND deleted_at IS NULL", id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Reserve{}, domain.ErrReserveNotFound
		}
		return domain.Reserve{}, fmt.Errorf("query reserve by id: %w", err)
	}

	return res, nil
}

// Save inserts a new reservation into Postgres. If this is the first reservation,
// EnsureTable automatically provisions the table based on the domain model.
func (r *ReserveRepository) Save(ctx context.Context, reserve domain.Reserve) (domain.Reserve, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return domain.Reserve{}, fmt.Errorf("ensure reserves table: %w", err)
	}

	createdBy := domain.ActorAuditID(ctx, reserve.CreatedBy)
	var hqPtr *string
	var roomHQ string
	if err := r.conn.QueryRow(ctx, "SELECT headquarters_id FROM rooms WHERE id = $1", reserve.RoomID).Scan(&roomHQ); err == nil && roomHQ != "" {
		hqPtr = &roomHQ
	} else if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		s := string(hqID)
		hqPtr = &s
	}

	saved := reserve
	saved.CreatedBy = createdBy
	query := `
		INSERT INTO reserves (
			id, room_id, person_id, check_in_date, check_out_date,
			number_of_guests, state, total_price, headquarters_id, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
		RETURNING created_at, updated_at
	`

	err := r.conn.QueryRow(
		ctx,
		query,
		reserve.ID,
		reserve.RoomID,
		reserve.PersonID,
		reserve.CheckInDate,
		reserve.CheckOutDate,
		reserve.NumberOfGuests,
		string(reserve.State),
		reserve.TotalPrice,
		hqPtr,
		createdBy,
	).Scan(&saved.CreatedAt, &saved.UpdatedAt)
	if err != nil {
		return domain.Reserve{}, fmt.Errorf("insert reserve: %w", err)
	}

	return saved, nil
}

// Update updates an existing reservation's mutable fields.
func (r *ReserveRepository) Update(ctx context.Context, reserve domain.Reserve) (domain.Reserve, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return domain.Reserve{}, fmt.Errorf("ensure reserves table: %w", err)
	}

	updatedBy := domain.ActorAuditID(ctx, "")
	saved := reserve
	query := `
		UPDATE reserves
		SET room_id = $2,
		    person_id = $3,
		    check_in_date = $4,
		    check_out_date = $5,
		    number_of_guests = $6,
		    state = $7,
		    total_price = $8,
		    updated_by = $9,
		    updated_at = now()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING created_at, updated_at
	`

	err := r.conn.QueryRow(
		ctx,
		query,
		reserve.ID,
		reserve.RoomID,
		reserve.PersonID,
		reserve.CheckInDate,
		reserve.CheckOutDate,
		reserve.NumberOfGuests,
		string(reserve.State),
		reserve.TotalPrice,
		updatedBy,
	).Scan(&saved.CreatedAt, &saved.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Reserve{}, domain.ErrReserveNotFound
		}
		return domain.Reserve{}, fmt.Errorf("update reserve: %w", err)
	}

	return saved, nil
}

// Delete removes a reservation by its ID.
func (r *ReserveRepository) Delete(ctx context.Context, id domain.ReserveID) error {
	if err := r.EnsureTable(ctx); err != nil {
		return fmt.Errorf("ensure reserves table: %w", err)
	}

	deletedBy := domain.ActorAuditID(ctx, "")
	tag, err := r.conn.Exec(ctx,
		"UPDATE reserves SET deleted_at = now(), deleted_by = $2, state = 'canceled' WHERE id = $1 AND deleted_at IS NULL",
		id, deletedBy,
	)
	if err != nil {
		return fmt.Errorf("delete reserve: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrReserveNotFound
	}

	return nil
}
