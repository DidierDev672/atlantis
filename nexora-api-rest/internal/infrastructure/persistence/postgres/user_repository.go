package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"nexora-api-rest/internal/domain"
)

// UserRepository is the Postgres adapter of domain.UserRepository.
type UserRepository struct {
	conn *pgxpool.Pool
}

func NewUserRepository(conn *pgxpool.Pool) *UserRepository {
	return &UserRepository{conn: conn}
}

var _ domain.UserRepository = (*UserRepository)(nil)

const userColumns = "id, name, email, password_hash, role_id, headquarters_id, sub_headquarters_id, COALESCE(all_headquarters, FALSE), status, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at"

// scanUser reads a row. headquarters_id and sub_headquarters_id are nullable,
// so they are scanned into *string first and converted into domain pointers.
func scanUser(row pgx.Row) (domain.User, error) {
	var (
		user             domain.User
		headquarterID    *string
		subHeadquarterID *string
	)
	err := row.Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.RoleID,
		&headquarterID, &subHeadquarterID, &user.AllHeadquarters,
		&user.Status, &user.CreatedBy, &user.UpdatedBy, &user.DeletedBy,
		&user.CreatedAt, &user.UpdatedAt, &user.DeletedAt,
	)
	if err != nil {
		return domain.User{}, err
	}
	if headquarterID != nil {
		id := domain.HeadquarterID(*headquarterID)
		user.HeadquartersID = &id
	}
	if subHeadquarterID != nil {
		id := domain.SubHeadquarterID(*subHeadquarterID)
		user.SubHeadquartersID = &id
	}
	return user, nil
}

func (r *UserRepository) loadUserHeadquarters(ctx context.Context, userID domain.UserID) ([]domain.HeadquarterID, error) {
	rows, err := r.conn.Query(ctx,
		"SELECT headquarters_id FROM users_headquarters WHERE user_id = $1 ORDER BY created_at ASC",
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []domain.HeadquarterID
	for rows.Next() {
		var hqID string
		if err := rows.Scan(&hqID); err != nil {
			return nil, err
		}
		ids = append(ids, domain.HeadquarterID(hqID))
	}
	return ids, rows.Err()
}

func (r *UserRepository) syncUserHeadquarters(ctx context.Context, user domain.User, actor string) error {
	_, _ = r.conn.Exec(ctx, "DELETE FROM users_headquarters WHERE user_id = $1", user.ID)

	seen := make(map[string]struct{})
	if user.HeadquartersID != nil && strings.TrimSpace(string(*user.HeadquartersID)) != "" {
		seen[strings.TrimSpace(string(*user.HeadquartersID))] = struct{}{}
	}
	for _, hq := range user.HeadquartersIDs {
		trimmed := strings.TrimSpace(string(hq))
		if trimmed != "" {
			seen[trimmed] = struct{}{}
		}
	}

	for hqID := range seen {
		_, err := r.conn.Exec(ctx,
			`INSERT INTO users_headquarters (user_id, headquarters_id, created_by, created_at)
			 VALUES ($1, $2, $3, now())
			 ON CONFLICT (user_id, headquarters_id) DO NOTHING`,
			user.ID, hqID, actor,
		)
		if err != nil {
			if isForeignKeyViolation(err) {
				return domain.ErrInvalidUserHeadquarterRef
			}
			return err
		}
	}
	return nil
}

func (r *UserRepository) FindAll(ctx context.Context) ([]domain.User, error) {
	query := "SELECT " + userColumns + " FROM users WHERE deleted_at IS NULL"
	var args []any

	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		query += ` AND (
			COALESCE(all_headquarters, FALSE) = TRUE
			OR headquarters_id = $1
			OR EXISTS (SELECT 1 FROM users_headquarters uh WHERE uh.user_id = users.id AND uh.headquarters_id = $1)
		)`
		args = append(args, string(hqID))
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query users: %w", err)
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		user, err := scanUser(rows)
		if err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range users {
		hqIDs, _ := r.loadUserHeadquarters(ctx, users[i].ID)
		users[i].HeadquartersIDs = hqIDs
	}
	return users, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id domain.UserID) (domain.User, error) {
	user, err := scanUser(r.conn.QueryRow(ctx, "SELECT "+userColumns+" FROM users WHERE id = $1 AND deleted_at IS NULL", id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.ErrUserNotFound
		}
		return domain.User{}, fmt.Errorf("query user by id: %w", err)
	}
	hqIDs, _ := r.loadUserHeadquarters(ctx, user.ID)
	user.HeadquartersIDs = hqIDs
	return user, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (domain.User, error) {
	user, err := scanUser(r.conn.QueryRow(ctx, "SELECT "+userColumns+" FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) AND deleted_at IS NULL", email))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.ErrUserNotFound
		}
		return domain.User{}, fmt.Errorf("query user by email: %w", err)
	}
	hqIDs, _ := r.loadUserHeadquarters(ctx, user.ID)
	user.HeadquartersIDs = hqIDs
	return user, nil
}

func (r *UserRepository) Save(ctx context.Context, user domain.User) error {
	createdBy := domain.ActorAuditID(ctx, user.CreatedBy)
	primaryHQ := user.HeadquartersID
	if primaryHQ == nil && len(user.HeadquartersIDs) > 0 {
		first := user.HeadquartersIDs[0]
		primaryHQ = &first
	}

	_, err := r.conn.Exec(ctx,
		`INSERT INTO users (id, name, email, password_hash, role_id, headquarters_id, sub_headquarters_id, all_headquarters, status, created_by, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())`,
		user.ID, user.Name, user.Email, user.PasswordHash, user.RoleID,
		optionalID(primaryHQ), optionalID(user.SubHeadquartersID),
		user.AllHeadquarters, user.Status, createdBy,
	)
	if err != nil {
		switch {
		case isUniqueViolation(err):
			return domain.ErrUserDuplicated
		case isForeignKeyViolation(err):
			return mapFKViolation(err)
		default:
			return fmt.Errorf("insert user: %w", err)
		}
	}

	if err := r.syncUserHeadquarters(ctx, user, createdBy); err != nil {
		return err
	}
	return nil
}

func (r *UserRepository) Update(ctx context.Context, user domain.User) error {
	updatedBy := domain.ActorAuditID(ctx, "")
	primaryHQ := user.HeadquartersID
	if primaryHQ == nil && len(user.HeadquartersIDs) > 0 {
		first := user.HeadquartersIDs[0]
		primaryHQ = &first
	}

	tag, err := r.conn.Exec(ctx,
		`UPDATE users
		 SET name = $2, email = $3, password_hash = $4, role_id = $5, headquarters_id = $6, sub_headquarters_id = $7,
		     all_headquarters = $8, status = $9, updated_by = $10, updated_at = now()
		 WHERE id = $1 AND deleted_at IS NULL`,
		user.ID, user.Name, user.Email, user.PasswordHash, user.RoleID,
		optionalID(primaryHQ), optionalID(user.SubHeadquartersID),
		user.AllHeadquarters, user.Status, updatedBy,
	)
	if err != nil {
		switch {
		case isUniqueViolation(err):
			return domain.ErrUserDuplicated
		case isForeignKeyViolation(err):
			return mapFKViolation(err)
		default:
			return fmt.Errorf("update user: %w", err)
		}
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrUserNotFound
	}

	if err := r.syncUserHeadquarters(ctx, user, updatedBy); err != nil {
		return err
	}
	return nil
}

func (r *UserRepository) Delete(ctx context.Context, id domain.UserID) error {
	deletedBy := domain.ActorAuditID(ctx, "")
	tag, err := r.conn.Exec(ctx,
		"UPDATE users SET deleted_at = now(), deleted_by = $2, status = 'inactive' WHERE id = $1 AND deleted_at IS NULL",
		id, deletedBy,
	)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrUserNotFound
	}
	return nil
}

// optionalID renders a domain ID pointer as a scalar for pgx: nil -> NULL.
func optionalID[T ~string](id *T) any {
	if id == nil {
		return nil
	}
	return string(*id)
}

func isForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23503"
	}
	return false
}

// mapFKViolation translates a foreign-key violation into the specific domain
// invariant it represents, so the API can tell which reference is invalid.
func mapFKViolation(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return domain.ErrInvalidUserReference
	}
	switch {
	case strings.Contains(pgErr.ConstraintName, "role_id"):
		return domain.ErrInvalidUserRoleRef
	case strings.Contains(pgErr.ConstraintName, "sub_headquarters_id"):
		return domain.ErrInvalidUserSubHeadquarterRef
	case strings.Contains(pgErr.ConstraintName, "headquarters_id"):
		return domain.ErrInvalidUserHeadquarterRef
	default:
		return domain.ErrInvalidUserReference
	}
}
