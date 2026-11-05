package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	externaldomain "nexora-api-rest/domain"
)

// RolePermissionRepository es el adaptador PostgreSQL para externaldomain.RolePermissionRepository.
type RolePermissionRepository struct {
	conn *pgxpool.Pool
}

func NewRolePermissionRepository(conn *pgxpool.Pool) *RolePermissionRepository {
	return &RolePermissionRepository{conn: conn}
}

var _ externaldomain.RolePermissionRepository = (*RolePermissionRepository)(nil)

func (r *RolePermissionRepository) Save(rp *externaldomain.RolePermission) error {
	ctx := context.Background()

	query := `
		INSERT INTO role_permissions (id, role_id, permission_id, granted_by, granted_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (role_id, permission_id) DO NOTHING
	`

	tag, err := r.conn.Exec(ctx, query,
		rp.ID(),
		rp.RoleID(),
		rp.PermissionID(),
		rp.GrantedBy(),
		rp.GrantedAt(),
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return externaldomain.ErrDuplicateRolePermission
		}
		return fmt.Errorf("insert role_permission: %w", err)
	}

	if tag.RowsAffected() == 0 {
		return externaldomain.ErrDuplicateRolePermission
	}

	return nil
}

func (r *RolePermissionRepository) FindAll() ([]*externaldomain.RolePermission, error) {
	ctx := context.Background()
	query := `SELECT id, role_id, permission_id, granted_by, granted_at FROM role_permissions ORDER BY granted_at DESC`

	rows, err := r.conn.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query role_permissions: %w", err)
	}
	defer rows.Close()

	var result []*externaldomain.RolePermission
	for rows.Next() {
		var (
			id           string
			roleID       string
			permissionID string
			grantedBy    *string
			grantedAt    time.Time
		)
		if err := rows.Scan(&id, &roleID, &permissionID, &grantedBy, &grantedAt); err != nil {
			return nil, fmt.Errorf("scan role_permission: %w", err)
		}
		rp, err := externaldomain.NewRolePermission(id, roleID, permissionID, grantedBy, grantedAt)
		if err != nil {
			return nil, err
		}
		result = append(result, rp)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows err role_permissions: %w", err)
	}
	return result, nil
}

func (r *RolePermissionRepository) FindByRoleID(roleID string) ([]*externaldomain.RolePermission, error) {
	ctx := context.Background()
	query := `SELECT id, role_id, permission_id, granted_by, granted_at FROM role_permissions WHERE role_id = $1 ORDER BY granted_at DESC`

	rows, err := r.conn.Query(ctx, query, roleID)
	if err != nil {
		return nil, fmt.Errorf("query role_permissions by role: %w", err)
	}
	defer rows.Close()

	var result []*externaldomain.RolePermission
	for rows.Next() {
		var (
			id           string
			roleID       string
			permissionID string
			grantedBy    *string
			grantedAt    time.Time
		)
		if err := rows.Scan(&id, &roleID, &permissionID, &grantedBy, &grantedAt); err != nil {
			return nil, fmt.Errorf("scan role_permission: %w", err)
		}
		rp, err := externaldomain.NewRolePermission(id, roleID, permissionID, grantedBy, grantedAt)
		if err != nil {
			return nil, err
		}
		result = append(result, rp)
	}
	if err := rows.Err(); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("rows err role_permissions by role: %w", err)
	}
	return result, nil
}

func (r *RolePermissionRepository) Delete(roleID, permissionID string) error {
	ctx := context.Background()
	query := `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`

	tag, err := r.conn.Exec(ctx, query, roleID, permissionID)
	if err != nil {
		return fmt.Errorf("delete role_permission: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return externaldomain.ErrRolePermissionNotFound
	}
	return nil
}

