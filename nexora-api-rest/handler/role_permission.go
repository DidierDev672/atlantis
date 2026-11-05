package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"nexora-api-rest/domain"
	"nexora-api-rest/usecase"
)

// RolePermissionHTTP maneja las peticiones HTTP para asignaciones de permisos a roles.
type RolePermissionHTTP struct {
	service *usecase.RolePermissionService
}

// NewRolePermissionHTTP crea el handler con su servicio inyectado.
func NewRolePermissionHTTP(svc *usecase.RolePermissionService) *RolePermissionHTTP {
	return &RolePermissionHTTP{service: svc}
}

// Register registra las rutas en el mux.
func (h *RolePermissionHTTP) Register(mux *http.ServeMux) {
	mux.HandleFunc("/role-permissions", h.handleRolePermissions)
	mux.HandleFunc("/role-permissions/", h.handleRolePermissionByPath)
	mux.HandleFunc("/role-permission", h.handleRolePermissions)
	mux.HandleFunc("/role-permission/", h.handleRolePermissionByPath)
}

// handleRolePermissions enruta GET (listar o filtrar por ?role_id=...) y POST (crear/asignar).
func (h *RolePermissionHTTP) handleRolePermissions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.list(w, r)
	case http.MethodPost:
		h.create(w, r)
	default:
		http.Error(w, "método no permitido", http.StatusMethodNotAllowed)
	}
}

// handleRolePermissionByPath enruta GET por role_id y DELETE por role_id/permission_id.
func (h *RolePermissionHTTP) handleRolePermissionByPath(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	for _, prefix := range []string{"/role-permissions/", "/role-permission/"} {
		if strings.HasPrefix(path, prefix) {
			path = strings.TrimPrefix(path, prefix)
			break
		}
	}
	parts := strings.Split(strings.Trim(path, "/"), "/")

	switch r.Method {
	case http.MethodGet:
		if len(parts) >= 1 && parts[0] != "" {
			h.listByRole(w, r, parts[0])
			return
		}
		h.list(w, r)
	case http.MethodDelete:
		if len(parts) >= 2 {
			h.delete(w, r, parts[0], parts[1])
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "para eliminar se requiere la ruta /role-permissions/{role_id}/{permission_id}",
		})
	default:
		http.Error(w, "método no permitido", http.StatusMethodNotAllowed)
	}
}

// list retorna las asignaciones (permite filtrar con ?role_id=...).
func (h *RolePermissionHTTP) list(w http.ResponseWriter, r *http.Request) {
	roleID := strings.TrimSpace(r.URL.Query().Get("role_id"))
	if roleID != "" {
		h.listByRole(w, r, roleID)
		return
	}

	items, err := h.service.FindAll()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if items == nil {
		items = make([]*domain.RolePermission, 0)
	}
	writeJSON(w, http.StatusOK, items)
}

// listByRole retorna los permisos asignados a un rol específico.
func (h *RolePermissionHTTP) listByRole(w http.ResponseWriter, _ *http.Request, roleID string) {
	items, err := h.service.FindByRoleID(roleID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if items == nil {
		items = make([]*domain.RolePermission, 0)
	}
	writeJSON(w, http.StatusOK, items)
}

// create recibe JSON, valida e inserta la asignación.
func (h *RolePermissionHTTP) create(w http.ResponseWriter, r *http.Request) {
	var dto usecase.CreateRolePermissionDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}

	item, err := h.service.Create(dto)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, domain.ErrRoleIDRequired) ||
			errors.Is(err, domain.ErrPermissionIDRequired) {
			status = http.StatusUnprocessableEntity
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}

	saved, err := h.service.Save(item)
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateRolePermission) {
			writeJSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, saved)
}

// delete revoca la asignación de un permiso a un rol.
func (h *RolePermissionHTTP) delete(w http.ResponseWriter, _ *http.Request, roleID, permissionID string) {
	if err := h.service.Delete(roleID, permissionID); err != nil {
		if errors.Is(err, domain.ErrRolePermissionNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

