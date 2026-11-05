package usecase

import (
	"errors"
	"strings"

	"nexora-api-rest/domain"
)

// ModuleService orquesta las operaciones sobre módulos.
// Depende de la interfaz del repositorio, no de una implementación concreta.
type ModuleService struct {
	repo domain.ModuleRepository
}

// NewModuleService inyecta el repositorio.
func NewModuleService(repo domain.ModuleRepository) *ModuleService {
	return &ModuleService{repo: repo}
}

// CreateModuleDTO es el contrato de entrada para crear un módulo.
type CreateModuleDTO struct {
	Code          string `json:"code"`
	SortOrder     *int16 `json:"sort_order,omitempty"`
	TypePath      string `json:"type_path"`
	TypeComponent string `json:"type_component"`
}

// UpdateModuleDTO es el contrato de entrada para actualizar un módulo.
type UpdateModuleDTO struct {
	Code          string `json:"code"`
	SortOrder     *int16 `json:"sort_order,omitempty"`
	TypePath      string `json:"type_path"`
	TypeComponent string `json:"type_component"`
}

// Create crea un módulo validando reglas de negocio.
func (s *ModuleService) Create(dto CreateModuleDTO) (*domain.Module, error) {
	code := strings.TrimSpace(dto.Code)
	typePath := strings.TrimSpace(dto.TypePath)
	typeComponent := strings.TrimSpace(dto.TypeComponent)

	// Compatibilidad: si envían code, autocompleta typePath y typeComponent
	if code != "" {
		if typePath == "" {
			typePath = code
		}
		if typeComponent == "" {
			typeComponent = code
		}
	} else if typePath != "" || typeComponent != "" {
		// Compatibilidad con payload legado
		if typeComponent != "" {
			code = typeComponent
		} else {
			code = typePath
		}
	} else {
		return nil, errors.New("el campo 'code' es obligatorio")
	}

	tp, err := domain.NewTypePath(typePath)
	if err != nil {
		return nil, err
	}
	tc, err := domain.NewTypeComponent(typeComponent)
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

	// El ID se asigna en persistencia (0 = placeholder)
	mod, err := domain.NewModuleWithCode(0, code, sortOrder, tp, tc)
	if err != nil {
		return nil, err
	}
	return mod, nil
}

// Save persiste un módulo y devuelve la entidad con su ID final.
func (s *ModuleService) Save(m *domain.Module) (*domain.Module, error) {
	id, err := s.repo.Save(m)
	if err != nil {
		return nil, err
	}
	if id != m.ID() {
		saved, derr := domain.NewModuleWithCode(id, m.Code(), m.SortOrder(), m.TypePath(), m.TypeComponent())
		if derr != nil {
			return nil, derr
		}
		return saved, nil
	}
	return m, nil
}

// FindByID busca un módulo por su ID.
func (s *ModuleService) FindByID(id int) (*domain.Module, error) {
	return s.repo.FindByID(id)
}

// FindAll retorna todos los módulos.
func (s *ModuleService) FindAll() ([]*domain.Module, error) {
	return s.repo.FindAll()
}

// Delete elimina un módulo por ID.
func (s *ModuleService) Delete(id int) error {
	return s.repo.Delete(id)
}
