package guestattendant

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// GuestAttendantSchemaDDL define la estructura de la tabla guest_attendants en PostgreSQL.
const GuestAttendantSchemaDDL = `
CREATE TABLE IF NOT EXISTS guest_attendants (
    id         VARCHAR(36) PRIMARY KEY,
    stay_id    VARCHAR(36) NOT NULL,
    person_ids TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guest_attendants_stay ON guest_attendants(stay_id);
`

// PostgresRepository es el adaptador de persistencia para PostgreSQL usando pgxpool (LSP).
type PostgresRepository struct {
	pool      *pgxpool.Pool
	initOnce  sync.Once
	initError error
}

// NewPostgresRepository instancia el repositorio de PostgreSQL.
func NewPostgresRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

var _ Repository = (*PostgresRepository)(nil)

// EnsureTable crea automáticamente la tabla e índices en Postgres la primera vez que se invoca.
func (r *PostgresRepository) EnsureTable(ctx context.Context) error {
	r.initOnce.Do(func() {
		_, r.initError = r.pool.Exec(ctx, GuestAttendantSchemaDDL)
	})
	return r.initError
}

const guestAttendantColumns = `id, stay_id, person_ids, created_at, updated_at`

func scanGuestAttendant(row pgx.Row) (GuestAttendant, error) {
	var a GuestAttendant
	var idStr, stayIDStr string
	var rawPersons []string

	err := row.Scan(
		&idStr,
		&stayIDStr,
		&rawPersons,
		&a.CreatedAt,
		&a.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return GuestAttendant{}, ErrNotFound
		}
		return GuestAttendant{}, err
	}

	a.ID = ID(idStr)
	a.StayID = StayID(stayIDStr)
	a.PersonIDs = make([]PersonID, len(rawPersons))
	for i, p := range rawPersons {
		a.PersonIDs[i] = PersonID(p)
	}

	return a, nil
}

// Create inserta un nuevo registro de acompañantes.
func (r *PostgresRepository) Create(ctx context.Context, a GuestAttendant) error {
	if err := r.EnsureTable(ctx); err != nil {
		return fmt.Errorf("ensure table on create: %w", err)
	}

	rawPersons := make([]string, len(a.PersonIDs))
	for i, p := range a.PersonIDs {
		rawPersons[i] = string(p)
	}

	query := fmt.Sprintf(`
	INSERT INTO guest_attendants (%s)
	VALUES ($1, $2, $3, $4, $5)
	`, guestAttendantColumns)

	_, err := r.pool.Exec(ctx, query,
		string(a.ID),
		string(a.StayID),
		rawPersons,
		a.CreatedAt,
		a.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("postgres insert guest_attendant: %w", err)
	}
	return nil
}

// GetByID consulta un registro por su ID único.
func (r *PostgresRepository) GetByID(ctx context.Context, id ID) (GuestAttendant, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return GuestAttendant{}, fmt.Errorf("ensure table: %w", err)
	}

	query := fmt.Sprintf(`
	SELECT %s
	FROM guest_attendants
	WHERE id = $1
	`, guestAttendantColumns)

	row := r.pool.QueryRow(ctx, query, string(id))
	return scanGuestAttendant(row)
}

// List retorna los acompañantes aplicando filtros opcionales.
func (r *PostgresRepository) List(ctx context.Context, filter ListFilter) ([]GuestAttendant, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return nil, fmt.Errorf("ensure table: %w", err)
	}

	query := fmt.Sprintf(`
	SELECT %s
	FROM guest_attendants
	`, guestAttendantColumns)

	var args []any
	if filter.StayID != nil {
		query += " WHERE stay_id = $1"
		args = append(args, string(*filter.StayID))
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query guest_attendants: %w", err)
	}
	defer rows.Close()

	list := make([]GuestAttendant, 0)
	for rows.Next() {
		item, err := scanGuestAttendant(rows)
		if err != nil {
			return nil, fmt.Errorf("scan guest_attendant: %w", err)
		}
		list = append(list, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate guest_attendants: %w", err)
	}

	return list, nil
}

// Update modifica los acompañantes de una estadía existente.
func (r *PostgresRepository) Update(ctx context.Context, a GuestAttendant) error {
	if err := r.EnsureTable(ctx); err != nil {
		return fmt.Errorf("ensure table: %w", err)
	}

	rawPersons := make([]string, len(a.PersonIDs))
	for i, p := range a.PersonIDs {
		rawPersons[i] = string(p)
	}

	query := `
	UPDATE guest_attendants
	SET person_ids = $2,
	    updated_at = $3
	WHERE id = $1
	`

	cmd, err := r.pool.Exec(ctx, query,
		string(a.ID),
		rawPersons,
		a.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("postgres update guest_attendant: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// Delete elimina una asignación de acompañantes.
func (r *PostgresRepository) Delete(ctx context.Context, id ID) error {
	if err := r.EnsureTable(ctx); err != nil {
		return fmt.Errorf("ensure table: %w", err)
	}

	cmd, err := r.pool.Exec(ctx, "DELETE FROM guest_attendants WHERE id = $1", string(id))
	if err != nil {
		return fmt.Errorf("postgres delete guest_attendant: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
