package rolelimit

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RoleLimitSchemaDDL define la estructura de la tabla role_limits en PostgreSQL.
// Garantiza la clave primaria compuesta (role_id, limit_key) y el check regex ReDoS-safe.
const RoleLimitSchemaDDL = `
CREATE TABLE IF NOT EXISTS role_limits (
    id        VARCHAR(36) NOT NULL,
    role_id   VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    limit_key TEXT        NOT NULL CHECK (limit_key ~ '^[a-z_]+$'),
    max_value INTEGER     NOT NULL CHECK (max_value >= 0),
    PRIMARY KEY (role_id, limit_key)
);
CREATE INDEX IF NOT EXISTS idx_role_limits_role_id ON role_limits(role_id);
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

// EnsureTable crea automáticamente la tabla role_limits y sus índices en Postgres si no existe.
func (r *PostgresRepository) EnsureTable(ctx context.Context) error {
	r.initOnce.Do(func() {
		_, r.initError = r.pool.Exec(ctx, RoleLimitSchemaDDL)
	})
	return r.initError
}

func (r *PostgresRepository) Create(ctx context.Context, limit RoleLimit) error {
	if err := r.EnsureTable(ctx); err != nil {
		return fmt.Errorf("ensure table: %w", err)
	}

	query := `
		INSERT INTO role_limits (id, role_id, limit_key, max_value)
		VALUES ($1, $2, $3, $4)
	`
	_, err := r.pool.Exec(ctx, query, string(limit.ID), limit.RoleID, limit.LimitKey, limit.MaxValue)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrDuplicateKey
		}
		return fmt.Errorf("postgres insert role_limit: %w", err)
	}
	return nil
}

func (r *PostgresRepository) Get(ctx context.Context, roleID, limitKey string) (RoleLimit, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return RoleLimit{}, err
	}

	query := `SELECT id, role_id, limit_key, max_value FROM role_limits WHERE role_id = $1 AND limit_key = $2`
	row := r.pool.QueryRow(ctx, query, roleID, limitKey)

	var idStr string
	var rl RoleLimit
	if err := row.Scan(&idStr, &rl.RoleID, &rl.LimitKey, &rl.MaxValue); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return RoleLimit{}, ErrNotFound
		}
		return RoleLimit{}, fmt.Errorf("postgres get role_limit: %w", err)
	}
	rl.ID = ID(idStr)
	return rl, nil
}

func (r *PostgresRepository) ListByRole(ctx context.Context, roleID string) ([]RoleLimit, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return nil, err
	}

	query := `SELECT id, role_id, limit_key, max_value FROM role_limits WHERE role_id = $1 ORDER BY limit_key ASC`
	rows, err := r.pool.Query(ctx, query, roleID)
	if err != nil {
		return nil, fmt.Errorf("postgres query role_limits by role: %w", err)
	}
	defer rows.Close()

	var result []RoleLimit
	for rows.Next() {
		var idStr string
		var rl RoleLimit
		if err := rows.Scan(&idStr, &rl.RoleID, &rl.LimitKey, &rl.MaxValue); err != nil {
			return nil, fmt.Errorf("postgres scan role_limit: %w", err)
		}
		rl.ID = ID(idStr)
		result = append(result, rl)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows err role_limits: %w", err)
	}
	return result, nil
}

func (r *PostgresRepository) ListAll(ctx context.Context) ([]RoleLimit, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return nil, err
	}

	query := `SELECT id, role_id, limit_key, max_value FROM role_limits ORDER BY role_id ASC, limit_key ASC`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("postgres query all role_limits: %w", err)
	}
	defer rows.Close()

	var result []RoleLimit
	for rows.Next() {
		var idStr string
		var rl RoleLimit
		if err := rows.Scan(&idStr, &rl.RoleID, &rl.LimitKey, &rl.MaxValue); err != nil {
			return nil, fmt.Errorf("postgres scan role_limit: %w", err)
		}
		rl.ID = ID(idStr)
		result = append(result, rl)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows err role_limits: %w", err)
	}
	return result, nil
}

func (r *PostgresRepository) Update(ctx context.Context, limit RoleLimit) error {
	if err := r.EnsureTable(ctx); err != nil {
		return err
	}

	query := `UPDATE role_limits SET max_value = $1 WHERE role_id = $2 AND limit_key = $3`
	tag, err := r.pool.Exec(ctx, query, limit.MaxValue, limit.RoleID, limit.LimitKey)
	if err != nil {
		return fmt.Errorf("postgres update role_limit: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresRepository) Delete(ctx context.Context, roleID, limitKey string) error {
	if err := r.EnsureTable(ctx); err != nil {
		return err
	}

	query := `DELETE FROM role_limits WHERE role_id = $1 AND limit_key = $2`
	tag, err := r.pool.Exec(ctx, query, roleID, limitKey)
	if err != nil {
		return fmt.Errorf("postgres delete role_limit: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

