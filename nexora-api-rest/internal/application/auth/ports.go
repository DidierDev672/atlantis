package auth

import (
	"context"

	"nexora-api-rest/internal/domain"
)

// PasswordVerifier is the security port used by login (DIP): the application
// knows a stored hash must be compared, but the algorithm lives in the
// infrastructure layer.
type PasswordVerifier interface {
	Compare(password, hash string) error
}

// TokenGenerator issues signed access tokens for authenticated users.
type TokenGenerator interface {
	GenerateForUser(id domain.UserID) (string, error)
}

// Authenticator is the narrow port used by the HTTP layer (ISP).
type Authenticator interface {
	Authenticate(ctx context.Context, in AuthenticateInput) (string, error)
}

// HeadquarterSummary represents a headquarter available to an authenticated user.
type HeadquarterSummary struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	City string `json:"city"`
}

// SessionUser represents the enriched identity and multi-sede permissions of
// the authenticated user.
type SessionUser struct {
	ID                  string               `json:"id"`
	Name                string               `json:"name"`
	Email               string               `json:"email"`
	RoleID              string               `json:"role_id"`
	RoleName            string               `json:"role_name"`
	AllHeadquarters     bool                 `json:"all_headquarters"`
	HeadquartersID      *string              `json:"headquarters_id,omitempty"`
	HeadquartersIDs     []string             `json:"headquarters_ids"`
	AllowedHeadquarters []HeadquarterSummary `json:"allowed_headquarters"`
}

// SessionResolver resolves the full user session profile for login and /auth/me.
type SessionResolver interface {
	ResolveByEmail(ctx context.Context, email string) (SessionUser, error)
	ResolveByUserID(ctx context.Context, id domain.UserID) (SessionUser, error)
}
