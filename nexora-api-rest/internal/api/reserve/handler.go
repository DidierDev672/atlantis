package reserve

import (
	"errors"
	"strings"
	"time"

	reserveapp "nexora-api-rest/internal/application/reserve"
	"nexora-api-rest/internal/domain"
)

// Handler composes the narrow use-case ports expected by the HTTP layer (ISP).
type Handler struct {
	Creator reserveapp.ReserveCreator
	Lister  reserveapp.ReserveLister
	Getter  reserveapp.ReserveGetter
	Updater reserveapp.ReserveUpdater
	Deleter reserveapp.ReserveDeleter
}

// reserveResponse represents the JSON projection of the reservation entity.
type reserveResponse struct {
	ID             string    `json:"id"`
	RoomID         string    `json:"room_id,omitempty"`
	PersonIDs      []string  `json:"person_ids"`
	CheckInDate    time.Time `json:"check_in_date"`
	CheckOutDate   time.Time `json:"check_out_date"`
	NumberOfGuests int       `json:"number_of_guests"`
	State          string    `json:"state"`
	TotalPrice     float64   `json:"total_price"`
	CreatedBy      string    `json:"created_by"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func newReserveResponse(r domain.Reserve) reserveResponse {
	personIDs := toPersonIDStrings(r.PersonIDs)
	if len(personIDs) == 0 && string(r.PersonID) != "" {
		personIDs = []string{string(r.PersonID)}
	}

	return reserveResponse{
		ID:             string(r.ID),
		RoomID:         string(r.RoomID),
		PersonIDs:      personIDs,
		CheckInDate:    r.CheckInDate,
		CheckOutDate:   r.CheckOutDate,
		NumberOfGuests: r.NumberOfGuests,
		State:          string(r.State),
		TotalPrice:     r.TotalPrice,
		CreatedBy:      r.CreatedBy,
		CreatedAt:      r.CreatedAt,
		UpdatedAt:      r.UpdatedAt,
	}
}

// toPersonIDs converts a raw slice of person id strings into domain.PersonID.
func toPersonIDs(raw []string) []domain.PersonID {
	ids := make([]domain.PersonID, 0, len(raw))
	for _, v := range raw {
		trimmed := strings.TrimSpace(v)
		if trimmed != "" {
			ids = append(ids, domain.PersonID(trimmed))
		}
	}
	return ids
}

// toPersonIDStrings converts a slice of domain.PersonID into raw strings.
func toPersonIDStrings(ids []domain.PersonID) []string {
	out := make([]string, 0, len(ids))
	for _, v := range ids {
		trimmed := strings.TrimSpace(string(v))
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

// parseDateTime parses date strings flexibly, accepting RFC3339 or ISO date format (YYYY-MM-DD).
func parseDateTime(raw string) (time.Time, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return time.Time{}, errors.New("date is required")
	}

	layouts := []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, trimmed); err == nil {
			return t.UTC(), nil
		}
	}

	return time.Time{}, errors.New("invalid date format: expected RFC3339 or YYYY-MM-DD")
}
