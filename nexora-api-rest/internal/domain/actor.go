package domain

import (
	"context"
	"errors"
	"strings"
)

// System role names seeded on fresh server installation.
const (
	RoleSuperAdmin   = "super_admin"
	RoleAdmin        = "admin"
	RoleReception    = "reception"
	RoleHousekeeping = "housekeeping"
	RoleManager      = "manager"
	RoleGuest        = "guest"
)

// Authorization and multi-sede tenant isolation sentinel errors.
var (
	ErrUnauthorized              = errors.New("authentication required")
	ErrForbidden                 = errors.New("insufficient role permissions")
	ErrHeadquarterAccessDenied   = errors.New("access to the requested headquarter is not allowed for this user")
	ErrCannotAssignSuperAdmin    = errors.New("only super_admin can create or assign the super_admin role")
	ErrHeadquarterCreationDenied = errors.New("only super_admin (technical support) can create or delete headquarters")
)

// Actor represents the authenticated user executing the current HTTP request
// and the active headquarter (sede) context for strict data isolation.
type Actor struct {
	UserID                 UserID
	Name                   string
	Email                  string
	RoleID                 RoleID
	RoleName               string
	AllHeadquarters        bool
	PrimaryHeadquarterID   *HeadquarterID
	AllowedHeadquartersIDs []HeadquarterID
	ActiveHeadquarterID    HeadquarterID
}

type actorContextKey struct{}

// WithActor attaches the authenticated Actor to the context.
func WithActor(ctx context.Context, actor Actor) context.Context {
	return context.WithValue(ctx, actorContextKey{}, actor)
}

// ActorFromContext retrieves the authenticated Actor from the context.
func ActorFromContext(ctx context.Context) (Actor, bool) {
	if ctx == nil {
		return Actor{}, false
	}
	actor, ok := ctx.Value(actorContextKey{}).(Actor)
	return actor, ok
}

// ActorAuditID returns the canonical audit identifier (email or user ID) of the
// authenticated actor in context. If no actor is in context (e.g. unit tests or
// bootstrap seeder), it falls back to fallback or DefaultUserCreatedBy.
func ActorAuditID(ctx context.Context, fallback string) string {
	if actor, ok := ActorFromContext(ctx); ok {
		if e := strings.TrimSpace(actor.Email); e != "" {
			return e
		}
		if id := strings.TrimSpace(string(actor.UserID)); id != "" {
			return id
		}
	}
	if f := strings.TrimSpace(fallback); f != "" && f != "user_system" && f != "u-123" {
		return f
	}
	return DefaultUserCreatedBy
}

// ActiveHeadquarterFromContext returns the active HeadquarterID from the actor
// in context, or empty if none is scoped.
func ActiveHeadquarterFromContext(ctx context.Context) (HeadquarterID, bool) {
	actor, ok := ActorFromContext(ctx)
	if !ok {
		return "", false
	}
	if strings.TrimSpace(string(actor.ActiveHeadquarterID)) != "" {
		return actor.ActiveHeadquarterID, true
	}
	if actor.PrimaryHeadquarterID != nil && strings.TrimSpace(string(*actor.PrimaryHeadquarterID)) != "" {
		return *actor.PrimaryHeadquarterID, true
	}
	if len(actor.AllowedHeadquartersIDs) > 0 {
		return actor.AllowedHeadquartersIDs[0], true
	}
	return "", false
}

// IsSuperAdmin reports whether the actor has the super_admin support role.
func (a Actor) IsSuperAdmin() bool {
	norm := normalizeRoleName(a.RoleName)
	return norm == RoleSuperAdmin || norm == "superadmin" || norm == "soporte"
}

// IsAdmin reports whether the actor has the hotel owner admin role.
func (a Actor) IsAdmin() bool {
	norm := normalizeRoleName(a.RoleName)
	return norm == RoleAdmin || norm == "administrador"
}

// CanAccessHeadquarter checks whether the actor is allowed to operate on hqID.
func (a Actor) CanAccessHeadquarter(hqID HeadquarterID) bool {
	target := strings.TrimSpace(string(hqID))
	if target == "" {
		return true
	}
	if a.IsSuperAdmin() || a.AllHeadquarters {
		return true
	}
	if a.PrimaryHeadquarterID != nil && string(*a.PrimaryHeadquarterID) == target {
		return true
	}
	for _, allowed := range a.AllowedHeadquartersIDs {
		if string(allowed) == target {
			return true
		}
	}
	return false
}

func normalizeRoleName(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	s = strings.ReplaceAll(s, "-", "_")
	s = strings.ReplaceAll(s, " ", "_")
	return s
}
