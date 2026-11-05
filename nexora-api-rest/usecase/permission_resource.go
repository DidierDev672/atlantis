package usecase

import (
	"errors"
	"strconv"
	"strings"

	"nexora-api-rest/domain"
)

// PermissionResourceService orquesta las operaciones de permisos de recursos.
type PermissionResourceService struct {
	repo domain.PermissionResourceRepository
}

// NewPermissionResourceService inyecta el repositorio.
func NewPermissionResourceService(repo domain.PermissionResourceRepository) *PermissionResourceService {
	return &PermissionResourceService{repo: repo}
}

// CreatePermissionResourceDTO contrato de entrada.
// ResourceID acepta tanto int como string ("7").
type CreatePermissionResourceDTO struct {
	ResourceID  any    `json:"resource_id"`
	Action      string `json:"action"`
	Description string `json:"description"`
	Permission  *bool  `json:"permission,omitempty"`
}

// UpdatePermissionResourceDTO contrato de entrada para actualizar.
type UpdatePermissionResourceDTO struct {
	Action      string `json:"action"`
	Description string `json:"description"`
	Permission  *bool  `json:"permission"`
}

// Create crea un PermissionResource validando reglas de negocio.
func (s *PermissionResourceService) Create(dto CreatePermissionResourceDTO) (*domain.PermissionResource, error) {
	resourceID, err := ParseResourceID(dto.ResourceID)
	if err != nil {
		return nil, err
	}

	action := strings.ToLower(strings.TrimSpace(dto.Action))
	if action == "" {
		return nil, domain.ErrActionRequired
	}

	permVal := true
	if dto.Permission != nil {
		permVal = *dto.Permission
	}
	perm := domain.NewPermission(permVal)

	return domain.NewPermissionResourceWithAction(0, resourceID, action, strings.TrimSpace(dto.Description), perm)
}

// Save persiste un permiso-recurso y devuelve la entidad con su ID final.
func (s *PermissionResourceService) Save(pr *domain.PermissionResource) (*domain.PermissionResource, error) {
	id, err := s.repo.Save(pr)
	if err != nil {
		return nil, err
	}
	if id != pr.ID() {
		saved, derr := domain.NewPermissionResourceWithAction(id, pr.ResourceID(), pr.Action(), pr.Description(), pr.Permission())
		if derr != nil {
			return nil, derr
		}
		return saved, nil
	}
	return pr, nil
}

// ParseResourceID convierte flexiblemente el identificador a un entero válido.
func ParseResourceID(v any) (int, error) {
	if v == nil {
		return 0, domain.ErrResourceIDRequired
	}
	switch val := v.(type) {
	case float64:
		if val <= 0 {
			return 0, domain.ErrResourceIDRequired
		}
		return int(val), nil
	case int:
		if val <= 0 {
			return 0, domain.ErrResourceIDRequired
		}
		return val, nil
	case string:
		trimmed := strings.TrimSpace(val)
		if trimmed == "" {
			return 0, domain.ErrResourceIDRequired
		}
		parsed, err := strconv.Atoi(trimmed)
		if err != nil || parsed <= 0 {
			return 0, errors.New("el campo 'resource_id' debe ser un identificador numérico válido mayor a 0")
		}
		return parsed, nil
	default:
		return 0, domain.ErrResourceIDRequired
	}
}

// FindByID busca por ID.
func (s *PermissionResourceService) FindByID(id int) (*domain.PermissionResource, error) {
	return s.repo.FindByID(id)
}

// FindByResourceID busca por resource ID.
func (s *PermissionResourceService) FindByResourceID(resourceID int) (*domain.PermissionResource, error) {
	return s.repo.FindByResourceID(resourceID)
}

// FindAll retorna todos.
func (s *PermissionResourceService) FindAll() ([]*domain.PermissionResource, error) {
	return s.repo.FindAll()
}

// Delete elimina por ID.
func (s *PermissionResourceService) Delete(id int) error {
	return s.repo.Delete(id)
}
