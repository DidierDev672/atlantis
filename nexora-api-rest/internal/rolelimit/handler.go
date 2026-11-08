package rolelimit

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"nexora-api-rest/internal/api/httpjson"
)

// Handler expone las operaciones HTTP para el vertical slice role_limits (Delivery layer).
type Handler struct {
	uc *UseCase
}

// NewHandler construye el handler inyectando el caso de uso (DIP).
func NewHandler(uc *UseCase) *Handler {
	return &Handler{uc: uc}
}

// Register asocia las rutas HTTP soportadas al multiplexor de Go stdlib (Go 1.22+).
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /role_limits", h.Create)
	mux.HandleFunc("POST /role-limits", h.Create)

	mux.HandleFunc("GET /role_limits", h.List)
	mux.HandleFunc("GET /role-limits", h.List)

	mux.HandleFunc("GET /role_limits/{role_id}", h.ListByRole)
	mux.HandleFunc("GET /role-limits/{role_id}", h.ListByRole)

	mux.HandleFunc("GET /role_limits/{role_id}/{limit_key}", h.Get)
	mux.HandleFunc("GET /role-limits/{role_id}/{limit_key}", h.Get)

	mux.HandleFunc("PUT /role_limits/{role_id}/{limit_key}", h.UpdateByPath)
	mux.HandleFunc("PUT /role-limits/{role_id}/{limit_key}", h.UpdateByPath)
	mux.HandleFunc("PUT /role_limits", h.Update)
	mux.HandleFunc("PUT /role-limits", h.Update)

	mux.HandleFunc("DELETE /role_limits/{role_id}/{limit_key}", h.Delete)
	mux.HandleFunc("DELETE /role-limits/{role_id}/{limit_key}", h.Delete)
}

// CreateRequest representa el payload recibido en POST /role_limits.
type CreateRequest struct {
	RoleID   any    `json:"role_id"`
	LimitKey string `json:"limit_key"`
	MaxValue *int   `json:"max_value"`
}

// UpdateRequest representa el payload recibido en PUT /role_limits.
type UpdateRequest struct {
	RoleID   any    `json:"role_id"`
	LimitKey string `json:"limit_key"`
	MaxValue *int   `json:"max_value"`
}

// parseString convierte de forma segura un valor numérico o string a string limpio.
func parseString(v any) string {
	if v == nil {
		return ""
	}
	switch val := v.(type) {
	case string:
		return strings.TrimSpace(val)
	case float64:
		return fmt.Sprintf("%.0f", val)
	case int:
		return fmt.Sprintf("%d", val)
	case int64:
		return fmt.Sprintf("%d", val)
	default:
		return fmt.Sprintf("%v", val)
	}
}

// Create procesa la creación de un nuevo límite por rol (POST).
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	roleID := parseString(req.RoleID)
	if roleID == "" {
		httpjson.WriteError(w, http.StatusUnprocessableEntity, ErrInvalidRoleID.Error())
		return
	}

	if strings.TrimSpace(req.LimitKey) == "" {
		httpjson.WriteError(w, http.StatusUnprocessableEntity, ErrEmptyLimitKey.Error())
		return
	}

	if req.MaxValue == nil {
		httpjson.WriteError(w, http.StatusUnprocessableEntity, "max_value is required")
		return
	}

	created, err := h.uc.Create(r.Context(), CreateInput{
		RoleID:   roleID,
		LimitKey: req.LimitKey,
		MaxValue: *req.MaxValue,
	})
	if err != nil {
		h.handleError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusCreated, created)
}

// List retorna todos los límites o filtra por query parameter ?role_id=... (GET).
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	roleID := strings.TrimSpace(r.URL.Query().Get("role_id"))
	if roleID != "" {
		items, err := h.uc.ListByRole(r.Context(), roleID)
		if err != nil {
			h.handleError(w, err)
			return
		}
		if items == nil {
			items = make([]RoleLimit, 0)
		}
		httpjson.WriteJSON(w, http.StatusOK, items)
		return
	}

	items, err := h.uc.ListAll(r.Context())
	if err != nil {
		h.handleError(w, err)
		return
	}
	if items == nil {
		items = make([]RoleLimit, 0)
	}
	httpjson.WriteJSON(w, http.StatusOK, items)
}

// ListByRole retorna todos los límites correspondientes a un role_id dado en la ruta (GET).
func (h *Handler) ListByRole(w http.ResponseWriter, r *http.Request) {
	roleID := r.PathValue("role_id")
	if strings.TrimSpace(roleID) == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "role_id is required")
		return
	}

	items, err := h.uc.ListByRole(r.Context(), roleID)
	if err != nil {
		h.handleError(w, err)
		return
	}
	if items == nil {
		items = make([]RoleLimit, 0)
	}
	httpjson.WriteJSON(w, http.StatusOK, items)
}

// Get obtiene un límite específico mediante ruta {role_id}/{limit_key} (GET).
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	roleID := r.PathValue("role_id")
	limitKey := r.PathValue("limit_key")

	item, err := h.uc.Get(r.Context(), roleID, limitKey)
	if err != nil {
		h.handleError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, item)
}

// UpdateByPath actualiza max_value usando los parámetros en la URL (PUT).
func (h *Handler) UpdateByPath(w http.ResponseWriter, r *http.Request) {
	roleID := r.PathValue("role_id")
	limitKey := r.PathValue("limit_key")

	var req UpdateRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.MaxValue == nil {
		httpjson.WriteError(w, http.StatusUnprocessableEntity, "max_value is required")
		return
	}

	updated, err := h.uc.Update(r.Context(), UpdateInput{
		RoleID:   roleID,
		LimitKey: limitKey,
		MaxValue: *req.MaxValue,
	})
	if err != nil {
		h.handleError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, updated)
}

// Update actualiza max_value usando el payload del body (PUT).
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	var req UpdateRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	roleID := parseString(req.RoleID)
	if roleID == "" {
		httpjson.WriteError(w, http.StatusUnprocessableEntity, ErrInvalidRoleID.Error())
		return
	}

	if strings.TrimSpace(req.LimitKey) == "" {
		httpjson.WriteError(w, http.StatusUnprocessableEntity, ErrEmptyLimitKey.Error())
		return
	}

	if req.MaxValue == nil {
		httpjson.WriteError(w, http.StatusUnprocessableEntity, "max_value is required")
		return
	}

	updated, err := h.uc.Update(r.Context(), UpdateInput{
		RoleID:   roleID,
		LimitKey: req.LimitKey,
		MaxValue: *req.MaxValue,
	})
	if err != nil {
		h.handleError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, updated)
}

// Delete elimina una restricción por su clave compuesta (DELETE).
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	roleID := r.PathValue("role_id")
	limitKey := r.PathValue("limit_key")

	if err := h.uc.Delete(r.Context(), roleID, limitKey); err != nil {
		h.handleError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// handleError traduce de forma unificada errores de dominio a respuestas HTTP estandarizadas.
func (h *Handler) handleError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		httpjson.WriteError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrDuplicateKey):
		httpjson.WriteError(w, http.StatusConflict, err.Error())
	case errors.Is(err, ErrInvalidID),
		errors.Is(err, ErrInvalidRoleID),
		errors.Is(err, ErrEmptyLimitKey),
		errors.Is(err, ErrInvalidLimitKey),
		errors.Is(err, ErrInvalidMaxValue):
		httpjson.WriteError(w, http.StatusUnprocessableEntity, err.Error())
	default:
		httpjson.WriteInternalError(w, err)
	}
}

