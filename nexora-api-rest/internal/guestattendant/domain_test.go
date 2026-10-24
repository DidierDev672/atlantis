package guestattendant_test

import (
	"errors"
	"testing"
	"time"

	"nexora-api-rest/internal/guestattendant"
)

func TestNewGuestAttendant(t *testing.T) {
	now := time.Now().UTC()

	tests := []struct {
		name        string
		id          guestattendant.ID
		stayID      guestattendant.StayID
		personIDs   []guestattendant.PersonID
		expectedErr error
	}{
		{
			name:        "valid creation",
			id:          "att-123",
			stayID:      "stay-456",
			personIDs:   []guestattendant.PersonID{"p-1", "p-2"},
			expectedErr: nil,
		},
		{
			name:        "missing id",
			id:          "   ",
			stayID:      "stay-456",
			personIDs:   []guestattendant.PersonID{"p-1"},
			expectedErr: guestattendant.ErrInvalidID,
		},
		{
			name:        "missing stay_id",
			id:          "att-123",
			stayID:      "",
			personIDs:   []guestattendant.PersonID{"p-1"},
			expectedErr: guestattendant.ErrInvalidStayID,
		},
		{
			name:        "empty person_id slice",
			id:          "att-123",
			stayID:      "stay-456",
			personIDs:   []guestattendant.PersonID{},
			expectedErr: guestattendant.ErrEmptyPersonIDs,
		},
		{
			name:        "blank person_id in slice",
			id:          "att-123",
			stayID:      "stay-456",
			personIDs:   []guestattendant.PersonID{"p-1", "  "},
			expectedErr: guestattendant.ErrInvalidPersonID,
		},
		{
			name:        "duplicate person_id in slice",
			id:          "att-123",
			stayID:      "stay-456",
			personIDs:   []guestattendant.PersonID{"p-1", "p-2", "p-1"},
			expectedErr: guestattendant.ErrDuplicatePersonID,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			att, err := guestattendant.NewGuestAttendant(tt.id, tt.stayID, tt.personIDs, now)
			if tt.expectedErr != nil {
				if !errors.Is(err, tt.expectedErr) {
					t.Fatalf("expected error %v, got %v", tt.expectedErr, err)
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if att.ID != tt.id {
				t.Errorf("expected ID %v, got %v", tt.id, att.ID)
			}
			if len(att.PersonIDs) != len(tt.personIDs) {
				t.Errorf("expected %d persons, got %d", len(tt.personIDs), len(att.PersonIDs))
			}
		})
	}
}
