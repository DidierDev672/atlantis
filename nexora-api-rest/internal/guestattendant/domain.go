package guestattendant

import (
	"errors"
	"strings"
	"time"
)

// Tipos personalizados fuertemente tipados (Value Objects).
type (
	// ID identifica de forma unívoca a la asignación de acompañantes de huésped.
	ID string

	// StayID identifica la estadía o reserva a la que se asocian los acompañantes.
	StayID string

	// PersonID identifica a una persona registrada como acompañante.
	PersonID string
)

func (id ID) String() string       { return string(id) }
func (id StayID) String() string   { return string(id) }
func (id PersonID) String() string { return string(id) }

// Sentinel errors del dominio para fallos de invariantes y reglas de negocio.
var (
	ErrNotFound          = errors.New("guest attendant record not found")
	ErrInvalidID         = errors.New("id is required")
	ErrInvalidStayID     = errors.New("id_stay is required")
	ErrEmptyPersonIDs    = errors.New("person_id list cannot be empty")
	ErrInvalidPersonID   = errors.New("person_id cannot be blank")
	ErrDuplicatePersonID = errors.New("duplicate person_id found in attendant list")
	ErrStayNotFound      = errors.New("stay does not exist")
	ErrPersonNotFound    = errors.New("one or more persons do not exist")
)

// GuestAttendant es la entidad central del dominio (Aggregate Root) que modela
// los acompañantes vinculados a una estadía específica.
type GuestAttendant struct {
	ID        ID         `json:"id"`
	StayID    StayID     `json:"id_stay"`
	PersonIDs []PersonID `json:"person_id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// NewGuestAttendant es el constructor oficial que valida y asegura las invariantes del dominio.
func NewGuestAttendant(
	id ID,
	stayID StayID,
	personIDs []PersonID,
	now time.Time,
) (GuestAttendant, error) {
	trimmedID := ID(strings.TrimSpace(string(id)))
	if trimmedID == "" {
		return GuestAttendant{}, ErrInvalidID
	}

	trimmedStayID := StayID(strings.TrimSpace(string(stayID)))
	if trimmedStayID == "" {
		return GuestAttendant{}, ErrInvalidStayID
	}

	cleanedPersons, err := sanitizeAndValidatePersons(personIDs)
	if err != nil {
		return GuestAttendant{}, err
	}

	if now.IsZero() {
		now = time.Now().UTC()
	}

	return GuestAttendant{
		ID:        trimmedID,
		StayID:    trimmedStayID,
		PersonIDs: cleanedPersons,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// UpdatePersonIDs actualiza la lista de acompañantes garantizando las invariantes de dominio.
func (g *GuestAttendant) UpdatePersonIDs(newPersons []PersonID, now time.Time) error {
	cleanedPersons, err := sanitizeAndValidatePersons(newPersons)
	if err != nil {
		return err
	}

	if now.IsZero() {
		now = time.Now().UTC()
	}

	g.PersonIDs = cleanedPersons
	g.UpdatedAt = now
	return nil
}

// sanitizeAndValidatePersons asegura que no haya identificadores vacíos ni duplicados (O(N)).
func sanitizeAndValidatePersons(personIDs []PersonID) ([]PersonID, error) {
	if len(personIDs) == 0 {
		return nil, ErrEmptyPersonIDs
	}

	seen := make(map[PersonID]struct{}, len(personIDs))
	cleaned := make([]PersonID, 0, len(personIDs))

	for _, p := range personIDs {
		trimmed := PersonID(strings.TrimSpace(string(p)))
		if trimmed == "" {
			return nil, ErrInvalidPersonID
		}

		if _, exists := seen[trimmed]; exists {
			return nil, ErrDuplicatePersonID
		}

		seen[trimmed] = struct{}{}
		cleaned = append(cleaned, trimmed)
	}

	return cleaned, nil
}
