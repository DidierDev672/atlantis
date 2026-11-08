package userlimit

import (
	"errors"
	"strings"
)

// ID identifica de forma unívoca el registro de límite de usuario (UUID).
type ID string

func (id ID) String() string {
	return string(id)
}

// Sentinel errors para violaciones de invariantes de negocio del dominio.
var (
	ErrNotFound        = errors.New("user limit not found")
	ErrInvalidID       = errors.New("id is required")
	ErrInvalidUserID   = errors.New("user_id is required")
	ErrEmptyLimitKey   = errors.New("limit_key is required")
	ErrInvalidLimitKey = errors.New("limit_key must contain only lowercase letters and underscores (^[a-z_]+$)")
	ErrInvalidMaxValue = errors.New("max_value cannot be negative")
	ErrDuplicateKey    = errors.New("a limit for this user and key already exists")
)

// UserLimit representa la entidad de dominio para cuotas y límites por usuario.
// Clave primaria compuesta en base de datos: (user_id, limit_key).
type UserLimit struct {
	ID       ID     `json:"id"`
	UserID   string `json:"user_id"`
	LimitKey string `json:"limit_key"`
	MaxValue int    `json:"max_value"`
}

// isValidLimitKey valida ReDoS-safe en O(N) que la clave cumpla ^[a-z_]+$
// sin usar expresiones regulares que puedan congelar el runtime ante payloads maliciosos.
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

// NewUserLimit crea y asegura las invariantes del dominio para un límite de usuario.
func NewUserLimit(id ID, userID, limitKey string, maxValue int) (UserLimit, error) {
	trimmedID := ID(strings.TrimSpace(string(id)))
	if trimmedID == "" {
		return UserLimit{}, ErrInvalidID
	}

	trimmedUserID := strings.TrimSpace(userID)
	if trimmedUserID == "" {
		return UserLimit{}, ErrInvalidUserID
	}

	trimmedKey := strings.ToLower(strings.TrimSpace(limitKey))
	if trimmedKey == "" {
		return UserLimit{}, ErrEmptyLimitKey
	}

	if !isValidLimitKey(trimmedKey) {
		return UserLimit{}, ErrInvalidLimitKey
	}

	if maxValue < 0 {
		return UserLimit{}, ErrInvalidMaxValue
	}

	return UserLimit{
		ID:       trimmedID,
		UserID:   trimmedUserID,
		LimitKey: trimmedKey,
		MaxValue: maxValue,
	}, nil
}

