package usecase

import (
	"crypto/rand"
	"fmt"
	"strings"
	"time"

	"nexora-api-rest/domain"
)

// RolePermissionService orquesta las operaciones de permisos de roles.
type RolePermissionService struct {
	repo domain.RolePermissionRepository
}

// NewRolePermissionService inyecta el repositorio.
func NewRolePermissionService(repo domain.RolePermissionRepository) *RolePermissionService {
	return &RolePermissionService{repo: repo}
}

// CreateRolePermissionDTO contrato flexible de entrada.
// Permite valores como string ("910dc925870dc286", "7") o números enteros.
type CreateRolePermissionDTO struct {
	RoleID       any  `json:"role_id"`
	PermissionID any  `json:"permission_id"`
	GrantedBy    *any `json:"granted_by,omitempty"`
}

// generateUUID genera un identificador UUID v4 estándar.
func generateUUID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

// parseID convierte valores numéricos o strings a string identificador limpio.
func parseID(val any, fieldName string, required bool) (*string, error) {
	if val == nil {
		if required {
			if fieldName == "role_id" {
				return nil, domain.ErrRoleIDRequired
			}
			if fieldName == "permission_id" {
				return nil, domain.ErrPermissionIDRequired
			}
			return nil, fmt.Errorf("el campo '%s' es requerido", fieldName)
		}
		return nil, nil
	}

	var res string
	switch v := val.(type) {
	case string:
		res = strings.TrimSpace(v)
	case float64:
		res = fmt.Sprintf("%.0f", v)
	case int:
		res = fmt.Sprintf("%d", v)
	case int64:
		res = fmt.Sprintf("%d", v)
	default:
		return nil, fmt.Errorf("el campo '%s' tiene un tipo no soportado", fieldName)
	}

	if res == "" {
		if required {
			if fieldName == "role_id" {
				return nil, domain.ErrRoleIDRequired
			}
			if fieldName == "permission_id" {
				return nil, domain.ErrPermissionIDRequired
			}
			return nil, fmt.Errorf("el campo '%s' no puede estar vacío", fieldName)
		}
		return nil, nil
	}

	return &res, nil
}

// Create valida las invariantes de negocio y retorna la entidad.
func (s *RolePermissionService) Create(dto CreateRolePermissionDTO) (*domain.RolePermission, error) {
	roleID, err := parseID(dto.RoleID, "role_id", true)
	if err != nil {
		return nil, err
	}

	permissionID, err := parseID(dto.PermissionID, "permission_id", true)
	if err != nil {
		return nil, err
	}

	var grantedBy *string
	if dto.GrantedBy != nil {
		gb, err := parseID(*dto.GrantedBy, "granted_by", false)
		if err != nil {
			return nil, err
		}
		grantedBy = gb
	}

	return domain.NewRolePermission(generateUUID(), *roleID, *permissionID, grantedBy, time.Now().UTC())
}

// Save persiste la asignación en el repositorio.
func (s *RolePermissionService) Save(rp *domain.RolePermission) (*domain.RolePermission, error) {
	if err := s.repo.Save(rp); err != nil {
		return nil, err
	}
	return rp, nil
}

// FindAll retorna todas las asignaciones rol-permiso.
func (s *RolePermissionService) FindAll() ([]*domain.RolePermission, error) {
	return s.repo.FindAll()
}

// FindByRoleID retorna las asignaciones correspondientes a un rol dado.
func (s *RolePermissionService) FindByRoleID(roleID string) ([]*domain.RolePermission, error) {
	roleID = strings.TrimSpace(roleID)
	if roleID == "" {
		return nil, domain.ErrRoleIDRequired
	}
	return s.repo.FindByRoleID(roleID)
}

// Delete revoca la asignación de un permiso a un rol.
func (s *RolePermissionService) Delete(roleID, permissionID string) error {
	roleID = strings.TrimSpace(roleID)
	permissionID = strings.TrimSpace(permissionID)
	if roleID == "" {
		return domain.ErrRoleIDRequired
	}
	if permissionID == "" {
		return domain.ErrPermissionIDRequired
	}
	return s.repo.Delete(roleID, permissionID)
}

