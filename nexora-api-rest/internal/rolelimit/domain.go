package rolelimit

import (
	"errors"
	"strings"
)

// ID identifica de forma unívoca el registro de límite de rol (UUID).
type ID string

func (id ID) String() string {
	return string(id)
}

// Sentinel errors para violaciones de invariantes de negocio del dominio.
var (
	ErrNotFound         = errors.New("role limit not found")
	ErrInvalidID        = errors.New("id is required")
	ErrInvalidRoleID    = errors.New("role_id is required")
	ErrEmptyLimitKey    = errors.New("limit_key is required")
	ErrInvalidLimitKey  = errors.New("limit_key must contain only lowercase letters and underscores (^[a-z_]+$)")
	ErrInvalidMaxValue  = errors.New("max_value cannot be negative")
	ErrDuplicateKey     = errors.New("a limit for this role and key already exists")
)

// RoleLimit representa la entidad de dominio para cuotas y límites por rol.
// Clave primaria compuesta en base de datos: (role_id, limit_key).
type RoleLimit struct {
	ID       ID     `json:"id"`
	RoleID   string `json:"role_id"`
	LimitKey string `json:"limit_key"`
	MaxValue int    `json:"max_value"`
}

// isValidLimitKey valida ReDoS-safe en O(N) que la clave cumpla ^[a-z_]+$
// sin usar expresiones regulares que puedan congelar el runtime.
func isValidLimitKey(k string) bool {
	if len(k) == 0 {
		return false
	}
	for i := 0; i < len(k); i++ {
		c := k[i]
		if (c < 'a' || c > 'z') && c != '_' {
			return false
		}
	}
	return true
}

// NewRoleLimit crea y asegura las invariantes del dominio para un límite de rol.
func NewRoleLimit(id ID, roleID, limitKey string, maxValue int) (RoleLimit, error) {
	trimmedID := ID(strings.TrimSpace(string(id)))
	if trimmedID == "" {
		return RoleLimit{}, ErrInvalidID
	}

	trimmedRoleID := strings.TrimSpace(roleID)
	if trimmedRoleID == "" {
		return RoleLimit{}, ErrInvalidRoleID
	}

	trimmedKey := strings.ToLower(strings.TrimSpace(limitKey))
	if trimmedKey == "" {
		return RoleLimit{}, ErrEmptyLimitKey
	}

	if !isValidLimitKey(trimmedKey) {
		return RoleLimit{}, ErrInvalidLimitKey
	}

	if maxValue < 0 {
		return RoleLimit{}, ErrInvalidMaxValue
	}

	return RoleLimit{
		ID:       trimmedID,
		RoleID:   trimmedRoleID,
		LimitKey: trimmedKey,
		MaxValue: maxValue,
	}, nil
}

