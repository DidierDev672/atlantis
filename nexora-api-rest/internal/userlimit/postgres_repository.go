package userlimit

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserLimitSchemaDDL define la estructura de la tabla user_limits en PostgreSQL.
// Garantiza la clave primaria compuesta (user_id, limit_key) y el check regex ReDoS-safe.
const UserLimitSchemaDDL = `
CREATE TABLE IF NOT EXISTS user_limits (
    id        VARCHAR(36) NOT NULL,
    user_id   VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    limit_key TEXT        NOT NULL CHECK (limit_key ~ '^[a-z_]+$'),
    max_value INTEGER     NOT NULL CHECK (max_value >= 0),
    PRIMARY KEY (user_id, limit_key)
);
CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON user_limits(user_id);
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

// EnsureTable crea automáticamente la tabla user_limits y sus índices en Postgres si no existe.
func (r *PostgresRepository) EnsureTable(ctx context.Context) error {
	r.initOnce.Do(func() {
		_, r.initError = r.pool.Exec(ctx, UserLimitSchemaDDL)
	})
	return r.initError
}

func (r *PostgresRepository) Create(ctx context.Context, limit UserLimit) error {
	if err := r.EnsureTable(ctx); err != nil {
		return fmt.Errorf("ensure table: %w", err)
	}

	query := `
		INSERT INTO user_limits (id, user_id, limit_key, max_value)
		VALUES ($1, $2, $3, $4)
	`
	_, err := r.pool.Exec(ctx, query, string(limit.ID), limit.UserID, limit.LimitKey, limit.MaxValue)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrDuplicateKey
		}
		return fmt.Errorf("postgres insert user_limit: %w", err)
	}
	return nil
}

func (r *PostgresRepository) Get(ctx context.Context, userID, limitKey string) (UserLimit, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return UserLimit{}, err
	}

	query := `SELECT id, user_id, limit_key, max_value FROM user_limits WHERE user_id = $1 AND limit_key = $2`
	row := r.pool.QueryRow(ctx, query, userID, limitKey)

	var idStr string
	var ul UserLimit
	if err := row.Scan(&idStr, &ul.UserID, &ul.LimitKey, &ul.MaxValue); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return UserLimit{}, ErrNotFound
		}
		return UserLimit{}, fmt.Errorf("postgres get user_limit: %w", err)
	}
	ul.ID = ID(idStr)
	return ul, nil
}

func (r *PostgresRepository) ListByUser(ctx context.Context, userID string) ([]UserLimit, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return nil, err
	}

	query := `SELECT id, user_id, limit_key, max_value FROM user_limits WHERE user_id = $1 ORDER BY limit_key ASC`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("postgres query user_limits by user: %w", err)
	}
	defer rows.Close()

	var result []UserLimit
	for rows.Next() {
		var idStr string
		var ul UserLimit
		if err := rows.Scan(&idStr, &ul.UserID, &ul.LimitKey, &ul.MaxValue); err != nil {
			return nil, fmt.Errorf("postgres scan user_limit: %w", err)
		}
		ul.ID = ID(idStr)
		result = append(result, ul)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows err user_limits: %w", err)
	}
	return result, nil
}

func (r *PostgresRepository) ListAll(ctx context.Context) ([]UserLimit, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return nil, err
	}

	query := `SELECT id, user_id, limit_key, max_value FROM user_limits ORDER BY user_id ASC, limit_key ASC`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("postgres query all user_limits: %w", err)
	}
	defer rows.Close()

	var result []UserLimit
	for rows.Next() {
		var idStr string
		var ul UserLimit
		if err := rows.Scan(&idStr, &ul.UserID, &ul.LimitKey, &ul.MaxValue); err != nil {
			return nil, fmt.Errorf("postgres scan user_limit: %w", err)
		}
		ul.ID = ID(idStr)
		result = append(result, ul)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows err user_limits: %w", err)
	}
	return result, nil
}

func (r *PostgresRepository) Update(ctx context.Context, limit UserLimit) error {
	if err := r.EnsureTable(ctx); err != nil {
		return err
	}

	query := `UPDATE user_limits SET max_value = $1 WHERE user_id = $2 AND limit_key = $3`
	tag, err := r.pool.Exec(ctx, query, limit.MaxValue, limit.UserID, limit.LimitKey)
	if err != nil {
		return fmt.Errorf("postgres update user_limit: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresRepository) Delete(ctx context.Context, userID, limitKey string) error {
	if err := r.EnsureTable(ctx); err != nil {
		return err
	}

	query := `DELETE FROM user_limits WHERE user_id = $1 AND limit_key = $2`
	tag, err := r.pool.Exec(ctx, query, userID, limitKey)
	if err != nil {
		return fmt.Errorf("postgres delete user_limit: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

