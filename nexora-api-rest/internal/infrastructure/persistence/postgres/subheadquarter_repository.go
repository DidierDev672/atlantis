package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"nexora-api-rest/internal/domain"
)

// SubHeadquarterRepository is the Postgres adapter of domain.SubHeadquarterRepository.
type SubHeadquarterRepository struct {
	conn *pgxpool.Pool
}

func NewSubHeadquarterRepository(conn *pgxpool.Pool) *SubHeadquarterRepository {
	return &SubHeadquarterRepository{conn: conn}
}

var _ domain.SubHeadquarterRepository = (*SubHeadquarterRepository)(nil)

const subHeadquarterColumns = "id, headquarter_id, name, address, phone, status, created_by, created_at, updated_at"

func scanSubHeadquarter(row pgx.Row) (domain.SubHeadquarter, error) {
	var sub domain.SubHeadquarter
	err := row.Scan(
		&sub.ID, &sub.HeadquarterID, &sub.Name, &sub.Address, &sub.Phone,
		&sub.Status, &sub.CreatedBy, &sub.CreatedAt, &sub.UpdatedAt,
	)
	return sub, err
}

func (r *SubHeadquarterRepository) FindAll(ctx context.Context) ([]domain.SubHeadquarter, error) {
	query := "SELECT " + subHeadquarterColumns + " FROM sub_headquarters WHERE deleted_at IS NULL"
	var args []any
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		query += " AND headquarter_id = $1"
		args = append(args, string(hqID))
	}
	rows, err := r.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query sub headquarters: %w", err)
	}
	defer rows.Close()

	var subHeadquarters []domain.SubHeadquarter
	for rows.Next() {
		sub, err := scanSubHeadquarter(rows)
		if err != nil {
			return nil, fmt.Errorf("scan sub headquarter: %w", err)
		}
		subHeadquarters = append(subHeadquarters, sub)
	}
	return subHeadquarters, rows.Err()
}

func (r *SubHeadquarterRepository) FindByID(ctx context.Context, id domain.SubHeadquarterID) (domain.SubHeadquarter, error) {
	sub, err := scanSubHeadquarter(r.conn.QueryRow(ctx, "SELECT "+subHeadquarterColumns+" FROM sub_headquarters WHERE id = $1 AND deleted_at IS NULL", id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.SubHeadquarter{}, domain.ErrSubHeadquarterNotFound
		}
		return domain.SubHeadquarter{}, fmt.Errorf("query sub headquarter by id: %w", err)
	}
	return sub, nil
}

func (r *SubHeadquarterRepository) FindByHeadquarter(ctx context.Context, headquarterID domain.HeadquarterID) ([]domain.SubHeadquarter, error) {
	rows, err := r.conn.Query(ctx, "SELECT "+subHeadquarterColumns+" FROM sub_headquarters WHERE headquarter_id = $1 AND deleted_at IS NULL", headquarterID)
	if err != nil {
		return nil, fmt.Errorf("query sub headquarters by headquarter: %w", err)
	}
	defer rows.Close()

	var subHeadquarters []domain.SubHeadquarter
	for rows.Next() {
		sub, err := scanSubHeadquarter(rows)
		if err != nil {
			return nil, fmt.Errorf("scan sub headquarter: %w", err)
		}
		subHeadquarters = append(subHeadquarters, sub)
	}
	return subHeadquarters, rows.Err()
}

func (r *SubHeadquarterRepository) FindByHeadquarterAndName(ctx context.Context, headquarterID domain.HeadquarterID, name string) (domain.SubHeadquarter, error) {
	sub, err := scanSubHeadquarter(r.conn.QueryRow(ctx,
		"SELECT "+subHeadquarterColumns+" FROM sub_headquarters WHERE headquarter_id = $1 AND name = $2 AND deleted_at IS NULL",
		headquarterID, name,
	))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.SubHeadquarter{}, domain.ErrSubHeadquarterNotFound
		}
		return domain.SubHeadquarter{}, fmt.Errorf("query sub headquarter by headquarter and name: %w", err)
	}
	return sub, nil
}

func (r *SubHeadquarterRepository) Save(ctx context.Context, sub domain.SubHeadquarter) error {
	createdBy := domain.ActorAuditID(ctx, sub.CreatedBy)
	_, err := r.conn.Exec(ctx,
		"INSERT INTO sub_headquarters (id, headquarter_id, name, address, phone, status, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())",
		sub.ID, sub.HeadquarterID, sub.Name, sub.Address, sub.Phone, sub.Status, createdBy,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrSubHeadquarterDuplicated
		}
		return fmt.Errorf("insert sub headquarter: %w", err)
	}
	return nil
}

func (r *SubHeadquarterRepository) Update(ctx context.Context, sub domain.SubHeadquarter) error {
	updatedBy := domain.ActorAuditID(ctx, "")
	tag, err := r.conn.Exec(ctx,
		"UPDATE sub_headquarters SET headquarter_id = $2, name = $3, address = $4, phone = $5, status = $6, updated_by = $7, updated_at = now() WHERE id = $1 AND deleted_at IS NULL",
		sub.ID, sub.HeadquarterID, sub.Name, sub.Address, sub.Phone, sub.Status, updatedBy,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrSubHeadquarterDuplicated
		}
		return fmt.Errorf("update sub headquarter: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrSubHeadquarterNotFound
	}
	return nil
}

func (r *SubHeadquarterRepository) Delete(ctx context.Context, id domain.SubHeadquarterID) error {
	deletedBy := domain.ActorAuditID(ctx, "")
	tag, err := r.conn.Exec(ctx,
		"UPDATE sub_headquarters SET deleted_at = now(), deleted_by = $2, status = 'inactive' WHERE id = $1 AND deleted_at IS NULL",
		id, deletedBy,
	)
	if err != nil {
		return fmt.Errorf("delete sub headquarter: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrSubHeadquarterNotFound
	}
	return nil
}
