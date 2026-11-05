package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"nexora-api-rest/internal/domain"
)

// BedTypeRepository is the Postgres adapter of domain.BedTypeRepository.
type BedTypeRepository struct {
	conn *pgxpool.Pool
}

func NewBedTypeRepository(conn *pgxpool.Pool) *BedTypeRepository {
	return &BedTypeRepository{conn: conn}
}

var _ domain.BedTypeRepository = (*BedTypeRepository)(nil)

const bedTypeColumns = "id, name, capacity_people, description, created_by, created_at, updated_at"

func scanBedType(row pgx.Row) (domain.BedType, error) {
	var bt domain.BedType
	err := row.Scan(
		&bt.ID, &bt.Name, &bt.CapacityPeople, &bt.Description,
		&bt.CreatedBy, &bt.CreatedAt, &bt.UpdatedAt,
	)
	return bt, err
}

func (r *BedTypeRepository) FindAll(ctx context.Context) ([]domain.BedType, error) {
	query := "SELECT " + bedTypeColumns + " FROM bed_types WHERE deleted_at IS NULL"
	var args []any
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		query += " AND (headquarters_id = $1 OR headquarters_id IS NULL)"
		args = append(args, string(hqID))
	}
	rows, err := r.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query bed types: %w", err)
	}
	defer rows.Close()

	var bedTypes []domain.BedType
	for rows.Next() {
		bt, err := scanBedType(rows)
		if err != nil {
			return nil, fmt.Errorf("scan bed type: %w", err)
		}
		bedTypes = append(bedTypes, bt)
	}
	return bedTypes, rows.Err()
}

func (r *BedTypeRepository) FindByID(ctx context.Context, id domain.BedTypeID) (domain.BedType, error) {
	bt, err := scanBedType(r.conn.QueryRow(ctx, "SELECT "+bedTypeColumns+" FROM bed_types WHERE id = $1 AND deleted_at IS NULL", id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.BedType{}, domain.ErrBedTypeNotFound
		}
		return domain.BedType{}, fmt.Errorf("query bed type by id: %w", err)
	}
	return bt, nil
}

func (r *BedTypeRepository) FindByName(ctx context.Context, name string) (domain.BedType, error) {
	query := "SELECT " + bedTypeColumns + " FROM bed_types WHERE name = $1 AND deleted_at IS NULL"
	args := []any{name}
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		query += " AND headquarters_id = $2"
		args = append(args, string(hqID))
	}
	bt, err := scanBedType(r.conn.QueryRow(ctx, query, args...))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.BedType{}, domain.ErrBedTypeNotFound
		}
		return domain.BedType{}, fmt.Errorf("query bed type by name: %w", err)
	}
	return bt, nil
}

func (r *BedTypeRepository) Save(ctx context.Context, bt domain.BedType) error {
	createdBy := domain.ActorAuditID(ctx, bt.CreatedBy)
	var hqPtr *string
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		s := string(hqID)
		hqPtr = &s
	}
	_, err := r.conn.Exec(ctx,
		"INSERT INTO bed_types (id, name, capacity_people, description, headquarters_id, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, now(), now())",
		bt.ID, bt.Name, bt.CapacityPeople, bt.Description, hqPtr, createdBy,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrBedTypeDuplicated
		}
		return fmt.Errorf("insert bed type: %w", err)
	}
	return nil
}

func (r *BedTypeRepository) Update(ctx context.Context, bt domain.BedType) error {
	updatedBy := domain.ActorAuditID(ctx, "")
	tag, err := r.conn.Exec(ctx,
		"UPDATE bed_types SET name = $2, capacity_people = $3, description = $4, updated_by = $5, updated_at = now() WHERE id = $1 AND deleted_at IS NULL",
		bt.ID, bt.Name, bt.CapacityPeople, bt.Description, updatedBy,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrBedTypeDuplicated
		}
		return fmt.Errorf("update bed type: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrBedTypeNotFound
	}
	return nil
}

func (r *BedTypeRepository) Delete(ctx context.Context, id domain.BedTypeID) error {
	deletedBy := domain.ActorAuditID(ctx, "")
	tag, err := r.conn.Exec(ctx,
		"UPDATE bed_types SET deleted_at = now(), deleted_by = $2, status = 'inactive' WHERE id = $1 AND deleted_at IS NULL",
		id, deletedBy,
	)
	if err != nil {
		return fmt.Errorf("delete bed type: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrBedTypeNotFound
	}
	return nil
}
