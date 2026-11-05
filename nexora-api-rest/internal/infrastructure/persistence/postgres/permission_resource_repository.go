package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	externaldomain "nexora-api-rest/domain"
)

// PermissionResourceRepository is the Postgres adapter of domain.PermissionResourceRepository.
type PermissionResourceRepository struct {
	conn *pgxpool.Pool
}

func NewPermissionResourceRepository(conn *pgxpool.Pool) *PermissionResourceRepository {
	return &PermissionResourceRepository{conn: conn}
}

var _ externaldomain.PermissionResourceRepository = (*PermissionResourceRepository)(nil)

func (r *PermissionResourceRepository) Save(pr *externaldomain.PermissionResource) (int, error) {
	ctx := context.Background()
	if pr.ID() <= 0 {
		var id int
		err := r.conn.QueryRow(ctx,
			"INSERT INTO permission_resources (resource_id, action, description, permission) VALUES ($1, $2, $3, $4) RETURNING id",
			pr.ResourceID(), pr.Action(), pr.Description(), pr.Permission().IsAllowed(),
		).Scan(&id)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				return 0, externaldomain.ErrDuplicatePermission
			}
			return 0, fmt.Errorf("insert permission resource: %w", err)
		}
		return id, nil
	}
	_, err := r.conn.Exec(ctx,
		`INSERT INTO permission_resources (id, resource_id, action, description, permission) VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (id) DO UPDATE SET resource_id = EXCLUDED.resource_id, action = EXCLUDED.action, description = EXCLUDED.description, permission = EXCLUDED.permission`,
		pr.ID(), pr.ResourceID(), pr.Action(), pr.Description(), pr.Permission().IsAllowed(),
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return 0, externaldomain.ErrDuplicatePermission
		}
		return 0, fmt.Errorf("upsert permission resource: %w", err)
	}
	return pr.ID(), nil
}

func (r *PermissionResourceRepository) FindByID(id int) (*externaldomain.PermissionResource, error) {
	var dbID, resourceID int
	var action, description string
	var permission bool
	err := r.conn.QueryRow(context.Background(),
		"SELECT id, resource_id, COALESCE(action, ''), COALESCE(description, ''), permission FROM permission_resources WHERE id = $1", id,
	).Scan(&dbID, &resourceID, &action, &description, &permission)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("permiso-recurso con ID %d no encontrado", id)
		}
		return nil, fmt.Errorf("query permission resource by id: %w", err)
	}
	pr, _ := externaldomain.NewPermissionResourceWithAction(dbID, resourceID, action, description, externaldomain.NewPermission(permission))
	return pr, nil
}

func (r *PermissionResourceRepository) FindByResourceID(resourceID int) (*externaldomain.PermissionResource, error) {
	var dbID int
	var action, description string
	var permission bool
	err := r.conn.QueryRow(context.Background(),
		"SELECT id, resource_id, COALESCE(action, ''), COALESCE(description, ''), permission FROM permission_resources WHERE resource_id = $1 ORDER BY id LIMIT 1", resourceID,
	).Scan(&dbID, &resourceID, &action, &description, &permission)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("permiso para recurso %d no encontrado", resourceID)
		}
		return nil, fmt.Errorf("query permission resource by resource id: %w", err)
	}
	pr, _ := externaldomain.NewPermissionResourceWithAction(dbID, resourceID, action, description, externaldomain.NewPermission(permission))
	return pr, nil
}

func (r *PermissionResourceRepository) FindAll() ([]*externaldomain.PermissionResource, error) {
	rows, err := r.conn.Query(context.Background(), "SELECT id, resource_id, COALESCE(action, ''), COALESCE(description, ''), permission FROM permission_resources ORDER BY id")
	if err != nil {
		return nil, fmt.Errorf("query permission resources: %w", err)
	}
	defer rows.Close()

	var items []*externaldomain.PermissionResource
	for rows.Next() {
		var dbID, resourceID int
		var action, description string
		var permission bool
		if err := rows.Scan(&dbID, &resourceID, &action, &description, &permission); err != nil {
			return nil, fmt.Errorf("scan permission resource: %w", err)
		}
		pr, _ := externaldomain.NewPermissionResourceWithAction(dbID, resourceID, action, description, externaldomain.NewPermission(permission))
		items = append(items, pr)
	}
	return items, rows.Err()
}

func (r *PermissionResourceRepository) Delete(id int) error {
	tag, err := r.conn.Exec(context.Background(), "DELETE FROM permission_resources WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete permission resource: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("permiso-recurso con ID %d no encontrado", id)
	}
	return nil
}
