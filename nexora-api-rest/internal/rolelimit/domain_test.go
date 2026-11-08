package rolelimit_test

import (
	"errors"
	"testing"

	"nexora-api-rest/internal/rolelimit"
)

func TestNewRoleLimit(t *testing.T) {
	t.Run("valid input creates role limit", func(t *testing.T) {
		rl, err := rolelimit.NewRoleLimit(
			rolelimit.ID("550e8400-e29b-41d4-a716-446655440000"),
			"role-admin",
			"sedes",
			10,
		)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if rl.RoleID != "role-admin" {
			t.Errorf("expected role-admin, got %s", rl.RoleID)
		}
		if rl.LimitKey != "sedes" {
			t.Errorf("expected sedes, got %s", rl.LimitKey)
		}
		if rl.MaxValue != 10 {
			t.Errorf("expected 10, got %d", rl.MaxValue)
		}
	})

	t.Run("empty id returns ErrInvalidID", func(t *testing.T) {
		_, err := rolelimit.NewRoleLimit("", "role-1", "sedes", 5)
		if !errors.Is(err, rolelimit.ErrInvalidID) {
			t.Fatalf("expected ErrInvalidID, got %v", err)
		}
	})

	t.Run("empty role_id returns ErrInvalidRoleID", func(t *testing.T) {
		_, err := rolelimit.NewRoleLimit("id-1", "   ", "sedes", 5)
		if !errors.Is(err, rolelimit.ErrInvalidRoleID) {
			t.Fatalf("expected ErrInvalidRoleID, got %v", err)
		}
	})

	t.Run("empty limit_key returns ErrEmptyLimitKey", func(t *testing.T) {
		_, err := rolelimit.NewRoleLimit("id-1", "role-1", "", 5)
		if !errors.Is(err, rolelimit.ErrEmptyLimitKey) {
			t.Fatalf("expected ErrEmptyLimitKey, got %v", err)
		}
	})

	t.Run("invalid limit_key characters returns ErrInvalidLimitKey", func(t *testing.T) {
		invalidKeys := []string{"Sedes-1", "sub sedes", "sedes!", "sedes-extra", "123sedes"}
		for _, k := range invalidKeys {
			_, err := rolelimit.NewRoleLimit("id-1", "role-1", k, 5)
			if !errors.Is(err, rolelimit.ErrInvalidLimitKey) {
				t.Errorf("for key %q: expected ErrInvalidLimitKey, got %v", k, err)
			}
		}
	})

	t.Run("valid snake_case limit_key succeeds", func(t *testing.T) {
		validKeys := []string{"sedes", "sub_sedes", "max_users", "habitaciones_permitidas"}
		for _, k := range validKeys {
			rl, err := rolelimit.NewRoleLimit("id-1", "role-1", k, 5)
			if err != nil {
				t.Errorf("for key %q: unexpected error %v", k, err)
			}
			if rl.LimitKey != k {
				t.Errorf("expected %s, got %s", k, rl.LimitKey)
			}
		}
	})

	t.Run("negative max_value returns ErrInvalidMaxValue", func(t *testing.T) {
		_, err := rolelimit.NewRoleLimit("id-1", "role-1", "sedes", -1)
		if !errors.Is(err, rolelimit.ErrInvalidMaxValue) {
			t.Fatalf("expected ErrInvalidMaxValue, got %v", err)
		}
	})
}

