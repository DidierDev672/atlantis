package rolelimit

import (
	"context"
	"crypto/rand"
	"fmt"
	"strings"
)

// IDGenerator define el puerto para generar identificadores de dominio (ISP + DIP).
type IDGenerator interface {
	NewID() ID
}

// CryptoIDGenerator es la implementación de IDGenerator que genera UUID v4 conforme a RFC 4122.
type CryptoIDGenerator struct{}

func (CryptoIDGenerator) NewID() ID {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	b[6] = (b[6] & 0x0f) | 0x40 // Versión 4
	b[8] = (b[8] & 0x3f) | 0x80 // Variante RFC 4122
	return ID(fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]))
}

// CreateInput transporta los datos requeridos para registrar un límite de rol.
type CreateInput struct {
	RoleID   string
	LimitKey string
	MaxValue int
}

// UpdateInput transporta los datos para actualizar el valor máximo de un límite.
type UpdateInput struct {
	RoleID   string
	LimitKey string
	MaxValue int
}

// UseCase orquesta la lógica de negocio y casos de uso de límites de roles (Application layer).
type UseCase struct {
	repo  Repository
	idGen IDGenerator
}

// NewUseCase construye el caso de uso inyectando el repositorio e ID generator.
func NewUseCase(repo Repository, idGen IDGenerator) *UseCase {
	if idGen == nil {
		idGen = CryptoIDGenerator{}
	}
	return &UseCase{
		repo:  repo,
		idGen: idGen,
	}
}

// Create valida invariantes y persiste un nuevo límite de rol.
func (uc *UseCase) Create(ctx context.Context, in CreateInput) (RoleLimit, error) {
	id := uc.idGen.NewID()

	limit, err := NewRoleLimit(id, in.RoleID, in.LimitKey, in.MaxValue)
	if err != nil {
		return RoleLimit{}, err
	}

	if err := uc.repo.Create(ctx, limit); err != nil {
		return RoleLimit{}, err
	}

	return limit, nil
}

// Get obtiene un límite específico por su clave primaria compuesta (role_id, limit_key).
func (uc *UseCase) Get(ctx context.Context, roleID, limitKey string) (RoleLimit, error) {
	cleanRoleID := strings.TrimSpace(roleID)
	if cleanRoleID == "" {
		return RoleLimit{}, ErrInvalidRoleID
	}

	cleanKey := strings.ToLower(strings.TrimSpace(limitKey))
	if cleanKey == "" {
		return RoleLimit{}, ErrEmptyLimitKey
	}

	return uc.repo.Get(ctx, cleanRoleID, cleanKey)
}

// ListByRole retorna todos los límites configurados para un rol.
func (uc *UseCase) ListByRole(ctx context.Context, roleID string) ([]RoleLimit, error) {
	cleanRoleID := strings.TrimSpace(roleID)
	if cleanRoleID == "" {
		return nil, ErrInvalidRoleID
	}
	return uc.repo.ListByRole(ctx, cleanRoleID)
}

// ListAll retorna todos los límites registrados en el sistema.
func (uc *UseCase) ListAll(ctx context.Context) ([]RoleLimit, error) {
	return uc.repo.ListAll(ctx)
}

// Update actualiza el valor de max_value para un límite existente.
func (uc *UseCase) Update(ctx context.Context, in UpdateInput) (RoleLimit, error) {
	existing, err := uc.Get(ctx, in.RoleID, in.LimitKey)
	if err != nil {
		return RoleLimit{}, err
	}

	if in.MaxValue < 0 {
		return RoleLimit{}, ErrInvalidMaxValue
	}

	updated, err := NewRoleLimit(existing.ID, existing.RoleID, existing.LimitKey, in.MaxValue)
	if err != nil {
		return RoleLimit{}, err
	}

	if err := uc.repo.Update(ctx, updated); err != nil {
		return RoleLimit{}, err
	}

	return updated, nil
}

// Delete elimina una restricción por su clave primaria compuesta.
func (uc *UseCase) Delete(ctx context.Context, roleID, limitKey string) error {
	cleanRoleID := strings.TrimSpace(roleID)
	if cleanRoleID == "" {
		return ErrInvalidRoleID
	}

	cleanKey := strings.ToLower(strings.TrimSpace(limitKey))
	if cleanKey == "" {
		return ErrEmptyLimitKey
	}

	return uc.repo.Delete(ctx, cleanRoleID, cleanKey)
}

