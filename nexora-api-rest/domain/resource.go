package domain

import (
	"encoding/json"
	"errors"
	"strings"
)

// Erros de dominio para Resource
var (
	ErrResourceIDRequired   = errors.New("el ID del recurso es requerido")
	ErrComponentRequired    = errors.New("component es requerido")
	ErrResourceNameRequired = errors.New("name es requerido")
	ErrModuleIDRequired     = errors.New("module ID es requerido")
)

// Component representa el tipo de componente. Value Object.
type Component string

// NewComponent valida y crea un Component.
func NewComponent(raw string) (Component, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", ErrComponentRequired
	}
	return Component(trimmed), nil
}

func (c Component) String() string {
	return string(c)
}

// ResourceName representa el nombre del recurso. Value Object.
type ResourceName string

// NewResourceName valida y crea un ResourceName.
func NewResourceName(raw string) (ResourceName, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", ErrResourceNameRequired
	}
	return ResourceName(trimmed), nil
}

func (rn ResourceName) String() string {
	return string(rn)
}

// Resource es la entidad principal del dominio.
type Resource struct {
	id         int
	code       string
	name       ResourceName
	sortOrder  int16
	showInMenu bool
	component  Component
	moduleID   int
}

// NewResource crea un Resource validando invariantes (soporte retrocompatible).
// id 0 se usa como placeholder: la persistencia asigna el ID final.
func NewResource(id int, component Component, name ResourceName, moduleID int) (*Resource, error) {
	if id < 0 {
		return nil, ErrResourceIDRequired
	}
	if moduleID <= 0 {
		return nil, ErrModuleIDRequired
	}
	return &Resource{
		id:         id,
		code:       component.String(),
		name:       name,
		sortOrder:  0,
		showInMenu: true,
		component:  component,
		moduleID:   moduleID,
	}, nil
}

// NewResourceWithDetails crea un Resource con todos sus atributos explícitos.
func NewResourceWithDetails(id int, code string, name ResourceName, sortOrder int16, showInMenu bool, component Component, moduleID int) (*Resource, error) {
	if id < 0 {
		return nil, ErrResourceIDRequired
	}
	if moduleID <= 0 {
		return nil, ErrModuleIDRequired
	}
	return &Resource{
		id:         id,
		code:       code,
		name:       name,
		sortOrder:  sortOrder,
		showInMenu: showInMenu,
		component:  component,
		moduleID:   moduleID,
	}, nil
}

// ID retorna el identificador del recurso.
func (r *Resource) ID() int {
	return r.id
}

// Code retorna el código del recurso.
func (r *Resource) Code() string {
	return r.code
}

// Name retorna el nombre del recurso.
func (r *Resource) Name() ResourceName {
	return r.name
}

// SortOrder retorna el orden del recurso.
func (r *Resource) SortOrder() int16 {
	return r.sortOrder
}

// ShowInMenu retorna si el recurso se muestra en el menú.
func (r *Resource) ShowInMenu() bool {
	return r.showInMenu
}

// Component retorna el tipo de componente.
func (r *Resource) Component() Component {
	return r.component
}

// ModuleID retorna el ID del módulo al que pertenece.
func (r *Resource) ModuleID() int {
	return r.moduleID
}

// SetCode actualiza el código del recurso.
func (r *Resource) SetCode(code string) {
	r.code = strings.TrimSpace(code)
}

// SetSortOrder actualiza el orden del recurso.
func (r *Resource) SetSortOrder(sortOrder int16) {
	r.sortOrder = sortOrder
}

// SetShowInMenu actualiza la visibilidad en menú.
func (r *Resource) SetShowInMenu(show bool) {
	r.showInMenu = show
}

// Rename cambia el nombre del recurso.
func (r *Resource) Rename(newName ResourceName) {
	r.name = newName
}

// ChangeComponent cambia el tipo de componente.
func (r *Resource) ChangeComponent(newComp Component) {
	r.component = newComp
}

// ReassignModule mueve el recurso a otro módulo.
func (r *Resource) ReassignModule(newModuleID int) error {
	if newModuleID <= 0 {
		return ErrModuleIDRequired
	}
	r.moduleID = newModuleID
	return nil
}

// resourceJSON es la representación JSON del recurso.
type resourceJSON struct {
	ID         int    `json:"id"`
	ModuleID   int    `json:"module_id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	SortOrder  int16  `json:"sort_order"`
	ShowInMenu bool   `json:"show_in_menu"`
	Component  string `json:"component"`
}

// MarshalJSON expone el recurso como JSON.
func (r *Resource) MarshalJSON() ([]byte, error) {
	return json.Marshal(resourceJSON{
		ID:         r.id,
		ModuleID:   r.moduleID,
		Code:       r.code,
		Name:       r.name.String(),
		SortOrder:  r.sortOrder,
		ShowInMenu: r.showInMenu,
		Component:  r.component.String(),
	})
}

// ResourceRepository define las operaciones de persistencia.
type ResourceRepository interface {
	// Save persiste un recurso y devuelve su ID final (asignado si era 0).
	Save(res *Resource) (int, error)
	FindByID(id int) (*Resource, error)
	FindByModuleID(moduleID int) ([]*Resource, error)
	FindAll() ([]*Resource, error)
	Delete(id int) error
}
