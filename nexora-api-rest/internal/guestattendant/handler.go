package guestattendant

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"nexora-api-rest/internal/api/httpjson"
)

// Handler expone las operaciones HTTP para el vertical slice guest-attendant (Delivery Layer).
type Handler struct {
	service UseCaseService
}

// NewHandler construye el handler inyectando el puerto de entrada UseCaseService (DIP).
func NewHandler(service UseCaseService) *Handler {
	return &Handler{service: service}
}

// Register asocia las rutas HTTP soportadas al router estándar net/http de Go.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /guest-attendant", h.Create)
	mux.HandleFunc("GET /guest-attendant", h.List)
	mux.HandleFunc("GET /guest-attendant/{id}", h.Get)
	mux.HandleFunc("PUT /guest-attendant/{id}", h.Update)
	mux.HandleFunc("PUT /guest-attendant", h.Update)
	mux.HandleFunc("DELETE /guest-attendant/{id}", h.Delete)
	mux.HandleFunc("DELETE /guest-attendant", h.Delete)
}

// CreateRequest representa el payload recibido en POST /guest-attendant.
type CreateRequest struct {
	StayID    string   `json:"id_stay"`
	PersonIDs []string `json:"person_id"`
}

// UpdateRequest representa el payload recibido en PUT /guest-attendant.
type UpdateRequest struct {
	ID        string   `json:"id"`
	PersonIDs []string `json:"person_id"`
}

// DeleteRequest representa el payload opcional recibido en DELETE /guest-attendant.
type DeleteRequest struct {
	ID string `json:"id"`
}

// Response es la proyección JSON estándar de GuestAttendant.
type Response struct {
	ID        string    `json:"id"`
	StayID    string    `json:"id_stay"`
	PersonIDs []string  `json:"person_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func newResponse(g GuestAttendant) Response {
	persons := make([]string, len(g.PersonIDs))
	for i, p := range g.PersonIDs {
		persons[i] = string(p)
	}
	return Response{
		ID:        string(g.ID),
		StayID:    string(g.StayID),
		PersonIDs: persons,
		CreatedAt: g.CreatedAt,
		UpdatedAt: g.UpdatedAt,
	}
}

// Create maneja POST /guest-attendant.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	created, err := h.service.Create(r.Context(), CreateInput{
		StayID:    req.StayID,
		PersonIDs: req.PersonIDs,
	})
	if err != nil {
		h.handleDomainError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusCreated, newResponse(created))
}

// Get maneja GET /guest-attendant/{id} o GET /guest-attendant?id=...
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimSpace(r.PathValue("id"))
	if idStr == "" {
		idStr = strings.TrimSpace(r.URL.Query().Get("id"))
	}
	if idStr == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "missing id parameter")
		return
	}

	item, err := h.service.GetByID(r.Context(), ID(idStr))
	if err != nil {
		h.handleDomainError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, newResponse(item))
}

// List maneja GET /guest-attendant (opcionalmente filtrado por ?id_stay=...).
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	var filter ListFilter
	if stayID := strings.TrimSpace(r.URL.Query().Get("id_stay")); stayID != "" {
		sID := StayID(stayID)
		filter.StayID = &sID
	}

	items, err := h.service.List(r.Context(), filter)
	if err != nil {
		h.handleDomainError(w, err)
		return
	}

	resp := make([]Response, len(items))
	for i, item := range items {
		resp[i] = newResponse(item)
	}

	httpjson.WriteJSON(w, http.StatusOK, resp)
}

// Update maneja PUT /guest-attendant/{id} o PUT /guest-attendant.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimSpace(r.PathValue("id"))

	var req UpdateRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if idStr == "" {
		idStr = strings.TrimSpace(req.ID)
	}
	if idStr == "" {
		idStr = strings.TrimSpace(r.URL.Query().Get("id"))
	}
	if idStr == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "missing id parameter")
		return
	}

	updated, err := h.service.Update(r.Context(), UpdateInput{
		ID:        ID(idStr),
		PersonIDs: req.PersonIDs,
	})
	if err != nil {
		h.handleDomainError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, newResponse(updated))
}

// Delete maneja DELETE /guest-attendant/{id} o DELETE /guest-attendant.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimSpace(r.PathValue("id"))
	if idStr == "" {
		idStr = strings.TrimSpace(r.URL.Query().Get("id"))
	}
	if idStr == "" && r.Body != nil {
		var req DeleteRequest
		_ = httpjson.DecodeJSON(r, &req)
		idStr = strings.TrimSpace(req.ID)
	}

	if idStr == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "missing id parameter")
		return
	}

	if err := h.service.Delete(r.Context(), ID(idStr)); err != nil {
		h.handleDomainError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) handleDomainError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		httpjson.WriteError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrInvalidID),
		errors.Is(err, ErrInvalidStayID),
		errors.Is(err, ErrEmptyPersonIDs),
		errors.Is(err, ErrInvalidPersonID),
		errors.Is(err, ErrDuplicatePersonID),
		errors.Is(err, ErrStayNotFound),
		errors.Is(err, ErrPersonNotFound):
		httpjson.WriteError(w, http.StatusUnprocessableEntity, err.Error())
	default:
		httpjson.WriteInternalError(w, err)
	}
}
