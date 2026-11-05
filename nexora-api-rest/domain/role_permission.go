package domain

import (
	"encoding/json"
	"errors"
	"time"
)

// Errores de dominio para RolePermission
var (
	ErrRoleIDRequired           = errors.New("el campo 'role_id' es requerido")
	ErrPermissionIDRequired     = errors.New("el campo 'permission_id' es requerido")
	ErrDuplicateRolePermission  = errors.New("la asignación entre este rol y permiso ya existe")
	ErrRolePermissionNotFound   = errors.New("la asignación de permiso para el rol no fue encontrada")
)

// RolePermission representa la asociación muchos a muchos entre Roles y Permisos.
// Clave primaria compuesta: (role_id, permission_id).
type RolePermission struct {
	id           string
	roleID       string
	permissionID string
	grantedBy    *string
	grantedAt    time.Time
}

// NewRolePermission crea una entidad validando invariantes.
func NewRolePermission(id, roleID, permissionID string, grantedBy *string, grantedAt time.Time) (*RolePermission, error) {
	if roleID == "" {
		return nil, ErrRoleIDRequired
	}
	if permissionID == "" {
		return nil, ErrPermissionIDRequired
	}
	if grantedAt.IsZero() {
		grantedAt = time.Now().UTC()
	}

	return &RolePermission{
		id:           id,
		roleID:       roleID,
		permissionID: permissionID,
		grantedBy:    grantedBy,
		grantedAt:    grantedAt,
	}, nil
}

func (rp *RolePermission) ID() string           { return rp.id }
func (rp *RolePermission) RoleID() string       { return rp.roleID }
func (rp *RolePermission) PermissionID() string { return rp.permissionID }
func (rp *RolePermission) GrantedBy() *string   { return rp.grantedBy }
func (rp *RolePermission) GrantedAt() time.Time { return rp.grantedAt }

func (rp *RolePermission) SetID(id string) { rp.id = id }

func (rp *RolePermission) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"id":            rp.id,
		"role_id":       rp.roleID,
		"permission_id": rp.permissionID,
		"granted_by":    rp.grantedBy,
		"granted_at":    rp.grantedAt.Format(time.RFC3339),
	})
}

// RolePermissionRepository contrato de persistencia.
type RolePermissionRepository interface {
	Save(rp *RolePermission) error
	FindAll() ([]*RolePermission, error)
	FindByRoleID(roleID string) ([]*RolePermission, error)
	Delete(roleID, permissionID string) error
}

