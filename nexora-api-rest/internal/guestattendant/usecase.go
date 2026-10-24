package guestattendant

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
)

// UseCaseService define el puerto primario de entrada (Primary Port) que encapsula
// la lógica pura de negocio de acompañantes de huéspedes (DIP + SRP).
type UseCaseService interface {
	Create(ctx context.Context, in CreateInput) (GuestAttendant, error)
	GetByID(ctx context.Context, id ID) (GuestAttendant, error)
	List(ctx context.Context, filter ListFilter) ([]GuestAttendant, error)
	Update(ctx context.Context, in UpdateInput) (GuestAttendant, error)
	Delete(ctx context.Context, id ID) error
}

// IDGenerator define el puerto para generar identificadores únicos de dominio.
type IDGenerator interface {
	NewID() ID
}

// CryptoIDGenerator genera identificadores criptográficamente seguros en hexadecimal.
type CryptoIDGenerator struct{}

func (CryptoIDGenerator) NewID() ID {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return ID(hex.EncodeToString(b))
}

// Clock abstrae la obtención del tiempo para asegurar determinismo en pruebas.
type Clock interface {
	Now() time.Time
}

// SystemClock provee el tiempo actual en UTC.
type SystemClock struct{}

func (SystemClock) Now() time.Time {
	return time.Now().UTC()
}

// CreateInput transporta los datos requeridos para registrar acompañantes a una estadía.
type CreateInput struct {
	StayID    string   `json:"id_stay"`
	PersonIDs []string `json:"person_id"`
}

// UpdateInput transporta los datos permitidos para modificar la lista de acompañantes.
type UpdateInput struct {
	ID        ID       `json:"id"`
	PersonIDs []string `json:"person_id"`
}

// UseCase orquesta la lógica de negocio sin dependencias de frameworks o bases de datos.
type UseCase struct {
	repo          Repository
	stayChecker   StayChecker
	personChecker PersonChecker
	idGen         IDGenerator
	clock         Clock
}

// Asegurar que UseCase implementa el puerto primario UseCaseService.
var _ UseCaseService = (*UseCase)(nil)

// NewUseCase construye el caso de uso inyectando sus puertos y dependencias (DIP).
func NewUseCase(
	repo Repository,
	stayChecker StayChecker,
	personChecker PersonChecker,
	idGen IDGenerator,
	clock Clock,
) *UseCase {
	if idGen == nil {
		idGen = CryptoIDGenerator{}
	}
	if clock == nil {
		clock = SystemClock{}
	}
	return &UseCase{
		repo:          repo,
		stayChecker:   stayChecker,
		personChecker: personChecker,
		idGen:         idGen,
		clock:         clock,
	}
}

// Create orquesta la creación y validación de una lista de acompañantes de estadía.
func (uc *UseCase) Create(ctx context.Context, in CreateInput) (GuestAttendant, error) {
	stayID := StayID(strings.TrimSpace(in.StayID))
	if stayID == "" {
		return GuestAttendant{}, ErrInvalidStayID
	}

	// Validación con slice externo si está inyectado (puerto angosto)
	if uc.stayChecker != nil {
		exists, err := uc.stayChecker.ValidateStayExists(ctx, stayID)
		if err != nil {
			return GuestAttendant{}, fmt.Errorf("validate stay: %w", err)
		}
		if !exists {
			return GuestAttendant{}, ErrStayNotFound
		}
	}

	persons := make([]PersonID, 0, len(in.PersonIDs))
	for _, p := range in.PersonIDs {
		pid := PersonID(strings.TrimSpace(p))
		if pid == "" {
			return GuestAttendant{}, ErrInvalidPersonID
		}
		if uc.personChecker != nil {
			exists, err := uc.personChecker.ValidatePersonExists(ctx, pid)
			if err != nil {
				return GuestAttendant{}, fmt.Errorf("validate person: %w", err)
			}
			if !exists {
				return GuestAttendant{}, ErrPersonNotFound
			}
		}
		persons = append(persons, pid)
	}

	id := uc.idGen.NewID()
	now := uc.clock.Now()

	attendant, err := NewGuestAttendant(id, stayID, persons, now)
	if err != nil {
		return GuestAttendant{}, err
	}

	if err := uc.repo.Create(ctx, attendant); err != nil {
		return GuestAttendant{}, fmt.Errorf("create guest attendant: %w", err)
	}

	return attendant, nil
}

// GetByID obtiene un registro por su ID de dominio.
func (uc *UseCase) GetByID(ctx context.Context, id ID) (GuestAttendant, error) {
	trimmedID := ID(strings.TrimSpace(string(id)))
	if trimmedID == "" {
		return GuestAttendant{}, ErrInvalidID
	}
	return uc.repo.GetByID(ctx, trimmedID)
}

// List recupera registros según los filtros indicados.
func (uc *UseCase) List(ctx context.Context, filter ListFilter) ([]GuestAttendant, error) {
	return uc.repo.List(ctx, filter)
}

// Update actualiza los acompañantes de una estadía existente.
func (uc *UseCase) Update(ctx context.Context, in UpdateInput) (GuestAttendant, error) {
	trimmedID := ID(strings.TrimSpace(string(in.ID)))
	if trimmedID == "" {
		return GuestAttendant{}, ErrInvalidID
	}

	existing, err := uc.repo.GetByID(ctx, trimmedID)
	if err != nil {
		return GuestAttendant{}, err
	}

	persons := make([]PersonID, 0, len(in.PersonIDs))
	for _, p := range in.PersonIDs {
		pid := PersonID(strings.TrimSpace(p))
		if pid == "" {
			return GuestAttendant{}, ErrInvalidPersonID
		}
		if uc.personChecker != nil {
			exists, err := uc.personChecker.ValidatePersonExists(ctx, pid)
			if err != nil {
				return GuestAttendant{}, fmt.Errorf("validate person: %w", err)
			}
			if !exists {
				return GuestAttendant{}, ErrPersonNotFound
			}
		}
		persons = append(persons, pid)
	}

	now := uc.clock.Now()
	if err := existing.UpdatePersonIDs(persons, now); err != nil {
		return GuestAttendant{}, err
	}

	if err := uc.repo.Update(ctx, existing); err != nil {
		return GuestAttendant{}, fmt.Errorf("update guest attendant: %w", err)
	}

	return existing, nil
}

// Delete elimina una asignación de acompañantes.
func (uc *UseCase) Delete(ctx context.Context, id ID) error {
	trimmedID := ID(strings.TrimSpace(string(id)))
	if trimmedID == "" {
		return ErrInvalidID
	}

	if _, err := uc.repo.GetByID(ctx, trimmedID); err != nil {
		return err
	}

	return uc.repo.Delete(ctx, trimmedID)
}
