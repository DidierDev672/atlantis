package user

import (
	"errors"
	"net/http"
	"strings"

	"nexora-api-rest/internal/api/httpjson"
	userapp "nexora-api-rest/internal/application/user"
	"nexora-api-rest/internal/domain"
)

// updateUserRequest is the payload accepted by PUT /users/{id} (full replace).
// password is optional: an empty value keeps the current hash.
type updateUserRequest struct {
	Name              string   `json:"name"`
	Email             string   `json:"email"`
	Password          string   `json:"password"`
	RoleID            string   `json:"role_id"`
	HeadquartersID    *string  `json:"headquarters_id"`
	HeadquartersIDs   []string `json:"headquarters_ids"`
	AllHeadquarters   bool     `json:"all_headquarters"`
	SubHeadquartersID *string  `json:"sub_headquarters_id"`
	Status            string   `json:"status"`
}

// Update is the HTTP entry point of the "update user" slice.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := domain.UserID(r.PathValue("id"))

	var req updateUserRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if actor, ok := domain.ActorFromContext(r.Context()); ok && actor.UserID != "" && !actor.IsSuperAdmin() && h.RoleRepo != nil {
		if targetRole, rErr := h.RoleRepo.FindByID(r.Context(), domain.RoleID(req.RoleID)); rErr == nil {
			if strings.EqualFold(string(targetRole.Name), domain.RoleSuperAdmin) {
				httpjson.WriteError(w, http.StatusForbidden, "no tienes permisos para asignar el rol de super_admin")
				return
			}
		}
	}

	hqIDs := make([]domain.HeadquarterID, 0, len(req.HeadquartersIDs))
	for _, raw := range req.HeadquartersIDs {
		if clean := strings.TrimSpace(raw); clean != "" {
			hqIDs = append(hqIDs, domain.HeadquarterID(clean))
		}
	}

	updated, err := h.Updater.Update(r.Context(), userapp.UpdateInput{
		ID:                id,
		Name:              req.Name,
		Email:             req.Email,
		Password:          req.Password,
		RoleID:            domain.RoleID(req.RoleID),
		HeadquartersID:    optionalHeadquarterID(req.HeadquartersID),
		HeadquartersIDs:   hqIDs,
		AllHeadquarters:   req.AllHeadquarters,
		SubHeadquartersID: optionalSubHeadquarterID(req.SubHeadquartersID),
		Status:            req.Status,
	})
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrUserNotFound):
			httpjson.WriteError(w, http.StatusNotFound, err.Error())
		case errors.Is(err, domain.ErrUserDuplicated):
			httpjson.WriteError(w, http.StatusConflict, err.Error())
		case isValidationError(err):
			httpjson.WriteError(w, http.StatusUnprocessableEntity, err.Error())
		default:
			httpjson.WriteInternalError(w, err)
		}
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, newUserResponse(updated))
}
