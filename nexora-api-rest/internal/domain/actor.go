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

// IsAdmin reports whether the actor has the hotel admin, support or manager role.
func (a Actor) IsAdmin() bool {
	if a.IsSuperAdmin() {
		return true
	}
	norm := normalizeRoleName(a.RoleName)
	return norm == RoleAdmin || norm == "administrador" || norm == RoleManager || norm == "gerente" || norm == "gerente_sede"
}

// IsReception reports whether the actor has the operational receptionist role.
func (a Actor) IsReception() bool {
	norm := normalizeRoleName(a.RoleName)
	return norm == RoleReception || norm == "recepcionista" || norm == "recepcion"
}

// HasFullAccess reports whether the actor has unrestricted access to all application routes and endpoints.
func (a Actor) HasFullAccess() bool {
	return a.IsSuperAdmin() || a.IsAdmin()
}

// AllowedNavRoutes returns the frontend navigation IDs (NavId) authorized for this actor's role.
func (a Actor) AllowedNavRoutes() []string {
	if a.HasFullAccess() {
		return []string{
			"home",
			"recepcion",
			"salidas",
			"habitacion",
			"reservas",
			"personas",
			"servicios",
			"sedes",
			"cama",
			"tarifas",
			"usuarios",
			"recursos",
			"auditoria",
			"paletas",
			"configuracion",
			"perfil",
		}
	}
	if a.IsReception() {
		return []string{
			"recepcion",
			"salidas",
			"habitacion",
			"reservas",
			"personas",
			"servicios",
			"perfil",
		}
	}
	return []string{"home", "perfil"}
}

// AllowedPermissions returns the granular capability identifiers granted to this actor's role.
func (a Actor) AllowedPermissions() []string {
	if a.HasFullAccess() {
		return []string{
			"*",
			"admin.full_access",
			"reception.manage",
			"checkout.manage",
			"billing.manage",
			"persons.manage",
			"rooms.manage",
			"reserves.manage",
			"services.manage",
			"menu.manage",
			"rates.manage",
			"users.manage",
			"roles.manage",
			"headquarters.manage",
			"audit.read",
			"settings.manage",
		}
	}
	if a.IsReception() {
		return []string{
			"reception.manage",
			"checkout.manage",
			"billing.manage",
			"persons.manage",
			"rooms.read",
			"rooms.update_status",
			"reserves.manage",
			"services.sell",
			"services.dispatch",
			"menu.read",
			"rates.read",
		}
	}
	return []string{"profile.read"}
}

// CanAccessEndpoint evaluates whether the authenticated actor is authorized to invoke the given HTTP method and path.
func (a Actor) CanAccessEndpoint(method, path string) bool {
	cleanPath := strings.TrimSpace(path)
	if cleanPath == "" || cleanPath == "/login" || method == "OPTIONS" {
		return true
	}
	if cleanPath == "/auth/me" {
		return strings.TrimSpace(string(a.UserID)) != ""
	}

	// Admin, SuperAdmin and Manager have full access to all routes.
	if a.HasFullAccess() {
		return true
	}

	if a.IsReception() {
		// 1. Full CRUD operational endpoints for Receptionist:
		// Check-in/stays, Check-out/billing (folios), Guests/persons, Reservations, Room Service orders & assignments
		fullAccessPrefixes := []string{
			"/stay",
			"/stays",
			"/stays_person",
			"/stay_person",
			"/folio",
			"/folios",
			"/person",
			"/persons",
			"/reserve",
			"/service-request",
			"/service-assignment",
			"/service-assignments",
			"/guest-attendant",
		}
		for _, prefix := range fullAccessPrefixes {
			if cleanPath == prefix || strings.HasPrefix(cleanPath, prefix+"/") {
				return true
			}
		}

		// 2. Rooms: Receptionist can read rooms and update room operational state (GET, PUT),
		// but cannot create or delete physical rooms (POST, DELETE).
		if cleanPath == "/room" || strings.HasPrefix(cleanPath, "/room/") {
			return method == "GET" || method == "PUT"
		}

		// 3. Read-only catalogs required for daily reception, room assignment, quoting and selling products:
		// Note: POST/PUT/DELETE on /menu-category and /item-menu are restricted to Admin.
		if method == "GET" {
			readOnlyPrefixes := []string{
				"/room-types",
				"/building",
				"/beds",
				"/bed",
				"/types-bed",
				"/rates",
				"/rate",
				"/room_tariffs",
				"/room_tariff",
				"/menu-category",
				"/item-menu",
				"/headquarters",
				"/sub-headquarters",
				"/palette",
				"/roles",
			}
			for _, prefix := range readOnlyPrefixes {
				if cleanPath == prefix || strings.HasPrefix(cleanPath, prefix+"/") {
					return true
				}
			}
		}

		return false
	}

	return false
}

// CanAccessHeadquarter checks whether the actor is allowed to operate on hqID.
func (a Actor) CanAccessHeadquarter(hqID HeadquarterID) bool {
	target := strings.TrimSpace(string(hqID))
	if target == "" {
		return true
	}
	if a.HasFullAccess() || a.AllHeadquarters {
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
