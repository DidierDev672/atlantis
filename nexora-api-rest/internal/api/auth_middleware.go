package api

import (
	"net/http"
	"strings"

	"nexora-api-rest/internal/api/httpjson"
	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/infrastructure/auth"
)

func extractBearerToken(r *http.Request) string {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
		return strings.TrimSpace(authHeader[7:])
	}
	if legacy := strings.TrimSpace(r.Header.Get("auth-token")); legacy != "" {
		return legacy
	}
	return ""
}

func authContextMiddleware(
	tokens *auth.JWTTokenGenerator,
	userRepo domain.UserRepository,
	roleRepo domain.RoleRepository,
	next http.Handler,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		requestedHQ := strings.TrimSpace(r.Header.Get("X-Headquarter-ID"))
		if requestedHQ == "" {
			requestedHQ = strings.TrimSpace(r.URL.Query().Get("headquarters_id"))
		}

		tokenStr := extractBearerToken(r)
		if tokenStr != "" && tokens != nil && userRepo != nil {
			if userID, err := tokens.ParseUserID(tokenStr); err == nil {
				if user, uErr := userRepo.FindByID(ctx, userID); uErr == nil {
					var roleName string
					if roleRepo != nil {
						if role, rErr := roleRepo.FindByID(ctx, user.RoleID); rErr == nil {
							roleName = string(role.Name)
						}
					}

					allowedHQs := make([]domain.HeadquarterID, 0, len(user.HeadquartersIDs)+1)
					seen := make(map[domain.HeadquarterID]struct{})
					if user.HeadquartersID != nil && strings.TrimSpace(string(*user.HeadquartersID)) != "" {
						hq := domain.HeadquarterID(strings.TrimSpace(string(*user.HeadquartersID)))
						seen[hq] = struct{}{}
						allowedHQs = append(allowedHQs, hq)
					}
					for _, hq := range user.HeadquartersIDs {
						clean := domain.HeadquarterID(strings.TrimSpace(string(hq)))
						if clean == "" {
							continue
						}
						if _, ok := seen[clean]; !ok {
							seen[clean] = struct{}{}
							allowedHQs = append(allowedHQs, clean)
						}
					}

					actor := domain.Actor{
						UserID:                 user.ID,
						Name:                   user.Name,
						Email:                  user.Email,
						RoleID:                 user.RoleID,
						RoleName:               roleName,
						AllHeadquarters:        user.AllHeadquarters || strings.EqualFold(roleName, domain.RoleSuperAdmin),
						PrimaryHeadquarterID:   user.HeadquartersID,
						AllowedHeadquartersIDs: allowedHQs,
					}

					if requestedHQ != "" {
						reqHQID := domain.HeadquarterID(requestedHQ)
						if !actor.CanAccessHeadquarter(reqHQID) {
							httpjson.WriteError(w, http.StatusForbidden, "no tienes permiso para operar en la sede seleccionada")
							return
						}
						actor.ActiveHeadquarterID = reqHQID
					} else if user.HeadquartersID != nil && strings.TrimSpace(string(*user.HeadquartersID)) != "" {
						actor.ActiveHeadquarterID = domain.HeadquarterID(strings.TrimSpace(string(*user.HeadquartersID)))
					} else if len(allowedHQs) > 0 {
						actor.ActiveHeadquarterID = allowedHQs[0]
					}

					// Reglas RBAC comerciales sobre sedes y usuarios cuando hay un actor autenticado:
					path := r.URL.Path
					if (path == "/headquarters" && r.Method == http.MethodPost) ||
						(strings.HasPrefix(path, "/headquarters/") && r.Method == http.MethodDelete) {
						if !actor.IsSuperAdmin() {
							httpjson.WriteError(w, http.StatusForbidden, "solo el equipo de soporte técnico (super_admin) puede crear o eliminar sedes")
							return
						}
					}

					if (path == "/users" || strings.HasPrefix(path, "/users/")) &&
						(r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodDelete) {
						if !actor.IsSuperAdmin() && !actor.IsAdmin() {
							httpjson.WriteError(w, http.StatusForbidden, "solo el administrador puede gestionar usuarios del hotel")
							return
						}
					}

					ctx = domain.WithActor(ctx, actor)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}
		}

		// Si no hay JWT pero se envió X-Headquarter-ID (ej. tests de integración o clientes internos),
		// inyectamos la sede activa en el contexto.
		if requestedHQ != "" {
			reqHQID := domain.HeadquarterID(requestedHQ)
			ctx = domain.WithActor(ctx, domain.Actor{
				ActiveHeadquarterID: reqHQID,
			})
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
