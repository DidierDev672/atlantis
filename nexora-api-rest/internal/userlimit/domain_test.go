package userlimit_test

import (
	"errors"
	"testing"

	"nexora-api-rest/internal/userlimit"
)

func TestNewUserLimit(t *testing.T) {
	t.Run("valid input creates user limit", func(t *testing.T) {
		ul, err := userlimit.NewUserLimit(
			userlimit.ID("550e8400-e29b-41d4-a716-446655440000"),
			"usr-12345",
			"sedes",
			10,
		)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if ul.UserID != "usr-12345" {
			t.Errorf("expected usr-12345, got %s", ul.UserID)
		}
		if ul.LimitKey != "sedes" {
			t.Errorf("expected sedes, got %s", ul.LimitKey)
		}
		if ul.MaxValue != 10 {
			t.Errorf("expected 10, got %d", ul.MaxValue)
		}
	})

	t.Run("empty id returns ErrInvalidID", func(t *testing.T) {
		_, err := userlimit.NewUserLimit("", "usr-1", "sedes", 5)
		if !errors.Is(err, userlimit.ErrInvalidID) {
			t.Fatalf("expected ErrInvalidID, got %v", err)
		}
	})

	t.Run("empty user_id returns ErrInvalidUserID", func(t *testing.T) {
		_, err := userlimit.NewUserLimit("id-1", "   ", "sedes", 5)
		if !errors.Is(err, userlimit.ErrInvalidUserID) {
			t.Fatalf("expected ErrInvalidUserID, got %v", err)
		}
	})

	t.Run("empty limit_key returns ErrEmptyLimitKey", func(t *testing.T) {
		_, err := userlimit.NewUserLimit("id-1", "usr-1", "", 5)
		if !errors.Is(err, userlimit.ErrEmptyLimitKey) {
			t.Fatalf("expected ErrEmptyLimitKey, got %v", err)
		}
	})

	t.Run("invalid limit_key characters returns ErrInvalidLimitKey", func(t *testing.T) {
		invalidKeys := []string{"Sedes-1", "sub sedes", "sedes!", "sedes-extra", "123sedes"}
		for _, k := range invalidKeys {
			_, err := userlimit.NewUserLimit("id-1", "usr-1", k, 5)
			if !errors.Is(err, userlimit.ErrInvalidLimitKey) {
				t.Errorf("for key %q: expected ErrInvalidLimitKey, got %v", k, err)
			}
		}
	})

	t.Run("valid snake_case limit_key succeeds", func(t *testing.T) {
		validKeys := []string{"sedes", "sub_sedes", "max_devices", "consultas_diarias"}
		for _, k := range validKeys {
			ul, err := userlimit.NewUserLimit("id-1", "usr-1", k, 5)
			if err != nil {
				t.Errorf("for key %q: unexpected error %v", k, err)
			}
			if ul.LimitKey != k {
				t.Errorf("expected %s, got %s", k, ul.LimitKey)
			}
		}
	})

	t.Run("negative max_value returns ErrInvalidMaxValue", func(t *testing.T) {
		_, err := userlimit.NewUserLimit("id-1", "usr-1", "sedes", -1)
		if !errors.Is(err, userlimit.ErrInvalidMaxValue) {
			t.Fatalf("expected ErrInvalidMaxValue, got %v", err)
		}
	})
}

