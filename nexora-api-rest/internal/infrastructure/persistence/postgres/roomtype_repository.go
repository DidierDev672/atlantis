package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"nexora-api-rest/internal/domain"
)

// RoomTypeRepository is the Postgres adapter of domain.RoomTypeRepository.
type RoomTypeRepository struct {
	conn *pgxpool.Pool
}

func NewRoomTypeRepository(conn *pgxpool.Pool) *RoomTypeRepository {
	return &RoomTypeRepository{conn: conn}
}

var _ domain.RoomTypeRepository = (*RoomTypeRepository)(nil)

const roomTypeColumns = "id, name, capacity, base_price, created_by, created_at, updated_at"

func scanRoomType(row pgx.Row) (domain.RoomType, error) {
	var rt domain.RoomType
	err := row.Scan(
		&rt.ID, &rt.Name, &rt.Capacity, &rt.BasePrice,
		&rt.CreatedBy, &rt.CreatedAt, &rt.UpdatedAt,
	)
	return rt, err
}

func (r *RoomTypeRepository) FindAll(ctx context.Context) ([]domain.RoomType, error) {
	query := "SELECT " + roomTypeColumns + " FROM room_types WHERE deleted_at IS NULL"
	var args []any
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		query += " AND (headquarters_id = $1 OR headquarters_id IS NULL)"
		args = append(args, string(hqID))
	}
	rows, err := r.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query room types: %w", err)
	}
	defer rows.Close()

	var roomTypes []domain.RoomType
	for rows.Next() {
		rt, err := scanRoomType(rows)
		if err != nil {
			return nil, fmt.Errorf("scan room type: %w", err)
		}
		roomTypes = append(roomTypes, rt)
	}
	return roomTypes, rows.Err()
}

func (r *RoomTypeRepository) FindByID(ctx context.Context, id domain.RoomTypeID) (domain.RoomType, error) {
	rt, err := scanRoomType(r.conn.QueryRow(ctx, "SELECT "+roomTypeColumns+" FROM room_types WHERE id = $1 AND deleted_at IS NULL", id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.RoomType{}, domain.ErrRoomTypeNotFound
		}
		return domain.RoomType{}, fmt.Errorf("query room type by id: %w", err)
	}
	return rt, nil
}

func (r *RoomTypeRepository) FindByName(ctx context.Context, name string) (domain.RoomType, error) {
	query := "SELECT " + roomTypeColumns + " FROM room_types WHERE name = $1 AND deleted_at IS NULL"
	args := []any{name}
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		query += " AND headquarters_id = $2"
		args = append(args, string(hqID))
	}
	rt, err := scanRoomType(r.conn.QueryRow(ctx, query, args...))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.RoomType{}, domain.ErrRoomTypeNotFound
		}
		return domain.RoomType{}, fmt.Errorf("query room type by name: %w", err)
	}
	return rt, nil
}

func (r *RoomTypeRepository) Save(ctx context.Context, rt domain.RoomType) error {
	createdBy := domain.ActorAuditID(ctx, rt.CreatedBy)
	var hqPtr *string
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		s := string(hqID)
		hqPtr = &s
	}
	_, err := r.conn.Exec(ctx,
		"INSERT INTO room_types (id, name, capacity, base_price, headquarters_id, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, now(), now())",
		rt.ID, rt.Name, rt.Capacity, rt.BasePrice, hqPtr, createdBy,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrRoomTypeDuplicated
		}
		return fmt.Errorf("insert room type: %w", err)
	}
	return nil
}

func (r *RoomTypeRepository) Update(ctx context.Context, rt domain.RoomType) error {
	updatedBy := domain.ActorAuditID(ctx, "")
	tag, err := r.conn.Exec(ctx,
		"UPDATE room_types SET name = $2, capacity = $3, base_price = $4, updated_by = $5, updated_at = now() WHERE id = $1 AND deleted_at IS NULL",
		rt.ID, rt.Name, rt.Capacity, rt.BasePrice, updatedBy,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrRoomTypeDuplicated
		}
		return fmt.Errorf("update room type: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrRoomTypeNotFound
	}
	return nil
}

func (r *RoomTypeRepository) Delete(ctx context.Context, id domain.RoomTypeID) error {
	deletedBy := domain.ActorAuditID(ctx, "")
	tag, err := r.conn.Exec(ctx,
		"UPDATE room_types SET deleted_at = now(), deleted_by = $2, status = 'inactive' WHERE id = $1 AND deleted_at IS NULL",
		id, deletedBy,
	)
	if err != nil {
		return fmt.Errorf("delete room type: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrRoomTypeNotFound
	}
	return nil
}
