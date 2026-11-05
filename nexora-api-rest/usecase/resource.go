package usecase

import (
	"errors"
	"strconv"
	"strings"

	"nexora-api-rest/domain"
)

// ResourceService orquesta las operaciones sobre recursos.
type ResourceService struct {
	repo domain.ResourceRepository
}

// NewResourceService inyecta el repositorio.
func NewResourceService(repo domain.ResourceRepository) *ResourceService {
	return &ResourceService{repo: repo}
}

// CreateResourceDTO contrato de entrada para crear un recurso.
// ModuleID usa any para soportar tanto números (29) como cadenas ("29").
type CreateResourceDTO struct {
	ModuleID   any    `json:"module_id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	SortOrder  *int16 `json:"sort_order,omitempty"`
	ShowInMenu *bool  `json:"show_in_menu,omitempty"`
	Component  string `json:"component"`
}

// UpdateResourceDTO contrato de entrada para actualizar un recurso.
type UpdateResourceDTO struct {
	ModuleID   any    `json:"module_id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	SortOrder  *int16 `json:"sort_order,omitempty"`
	ShowInMenu *bool  `json:"show_in_menu,omitempty"`
	Component  string `json:"component"`
}

// Create crea un recurso validando reglas de negocio.
func (s *ResourceService) Create(dto CreateResourceDTO) (*domain.Resource, error) {
	moduleID, err := ParseModuleID(dto.ModuleID)
	if err != nil {
		return nil, err
	}

	nameStr := strings.TrimSpace(dto.Name)
	name, err := domain.NewResourceName(nameStr)
	if err != nil {
		return nil, err
	}

	code := strings.TrimSpace(dto.Code)
	component := strings.TrimSpace(dto.Component)
	if code != "" && component == "" {
		component = code
	} else if component != "" && code == "" {
		code = component
	}
	if code == "" {
		return nil, errors.New("el campo 'code' es obligatorio")
	}

	comp, err := domain.NewComponent(component)
	if err != nil {
		return nil, err
	}

	var sortOrder int16 = 0
	if dto.SortOrder != nil {
		if *dto.SortOrder < 0 {
			return nil, errors.New("el campo 'sort_order' debe ser mayor o igual a 0")
		}
		sortOrder = *dto.SortOrder
	}

	showInMenu := true
	if dto.ShowInMenu != nil {
		showInMenu = *dto.ShowInMenu
	}

	return domain.NewResourceWithDetails(0, code, name, sortOrder, showInMenu, comp, moduleID)
}

// Save persiste un recurso y devuelve la entidad con su ID final.
func (s *ResourceService) Save(res *domain.Resource) (*domain.Resource, error) {
	id, err := s.repo.Save(res)
	if err != nil {
		return nil, err
	}
	if id != res.ID() {
		saved, derr := domain.NewResourceWithDetails(id, res.Code(), res.Name(), res.SortOrder(), res.ShowInMenu(), res.Component(), res.ModuleID())
		if derr != nil {
			return nil, derr
		}
		return saved, nil
	}
	return res, nil
}

func ParseModuleID(v any) (int, error) {
	if v == nil {
		return 0, domain.ErrModuleIDRequired
	}
	switch val := v.(type) {
	case float64:
		if val <= 0 {
			return 0, domain.ErrModuleIDRequired
		}
		return int(val), nil
	case int:
		if val <= 0 {
			return 0, domain.ErrModuleIDRequired
		}
		return val, nil
	case string:
		trimmed := strings.TrimSpace(val)
		if trimmed == "" {
			return 0, domain.ErrModuleIDRequired
		}
		parsed, err := strconv.Atoi(trimmed)
		if err != nil || parsed <= 0 {
			return 0, errors.New("el campo 'module_id' debe ser un identificador numérico válido mayor a 0")
		}
		return parsed, nil
	default:
		return 0, domain.ErrModuleIDRequired
	}
}

// FindByID busca un recurso por ID.
func (s *ResourceService) FindByID(id int) (*domain.Resource, error) {
	return s.repo.FindByID(id)
}

// FindByModuleID retorna todos los recursos de un módulo.
func (s *ResourceService) FindByModuleID(moduleID int) ([]*domain.Resource, error) {
	return s.repo.FindByModuleID(moduleID)
}

// FindAll retorna todos los recursos.
func (s *ResourceService) FindAll() ([]*domain.Resource, error) {
	return s.repo.FindAll()
}

// Delete elimina un recurso por ID.
func (s *ResourceService) Delete(id int) error {
	return s.repo.Delete(id)
}
