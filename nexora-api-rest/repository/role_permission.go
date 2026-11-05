package repository

import (
	"strings"
	"sync"

	"nexora-api-rest/domain"
)

type compositeKey struct {
	roleID       string
	permissionID string
}

// InMemoryRolePermissionRepo implementa domain.RolePermissionRepository en memoria.
type InMemoryRolePermissionRepo struct {
	store map[compositeKey]*domain.RolePermission
	mu    sync.RWMutex
}

// NewInMemoryRolePermissionRepo crea una nueva instancia.
func NewInMemoryRolePermissionRepo() *InMemoryRolePermissionRepo {
	return &InMemoryRolePermissionRepo{
		store: make(map[compositeKey]*domain.RolePermission),
	}
}

// Save almacena o rechaza si ya existe la clave compuesta (role_id, permission_id).
func (r *InMemoryRolePermissionRepo) Save(rp *domain.RolePermission) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := compositeKey{
		roleID:       strings.ToLower(rp.RoleID()),
		permissionID: strings.ToLower(rp.PermissionID()),
	}

	if _, exists := r.store[key]; exists {
		return domain.ErrDuplicateRolePermission
	}

	r.store[key] = rp
	return nil
}

// FindAll retorna todas las asignaciones.
func (r *InMemoryRolePermissionRepo) FindAll() ([]*domain.RolePermission, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*domain.RolePermission, 0, len(r.store))
	for _, rp := range r.store {
		result = append(result, rp)
	}
	return result, nil
}

// FindByRoleID retorna las asignaciones de un rol.
func (r *InMemoryRolePermissionRepo) FindByRoleID(roleID string) ([]*domain.RolePermission, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*domain.RolePermission
	target := strings.ToLower(roleID)
	for key, rp := range r.store {
		if key.roleID == target {
			result = append(result, rp)
		}
	}
	return result, nil
}

// Delete elimina una asignación (role_id, permission_id).
func (r *InMemoryRolePermissionRepo) Delete(roleID, permissionID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := compositeKey{
		roleID:       strings.ToLower(roleID),
		permissionID: strings.ToLower(permissionID),
	}

	if _, exists := r.store[key]; !exists {
		return domain.ErrRolePermissionNotFound
	}

	delete(r.store, key)
	return nil
}

