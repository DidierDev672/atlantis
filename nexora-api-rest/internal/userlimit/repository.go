package userlimit

import (
	"context"
)

// Repository define el puerto secundario de persistencia para UserLimit (DIP + ISP).
// Es agnóstico a cualquier base de datos o tecnología subyacente.
type Repository interface {
	// EnsureTable crea de forma idempotente la tabla en la base de datos si no existe.
	EnsureTable(ctx context.Context) error
	Create(ctx context.Context, limit UserLimit) error
	Get(ctx context.Context, userID, limitKey string) (UserLimit, error)
	ListByUser(ctx context.Context, userID string) ([]UserLimit, error)
	ListAll(ctx context.Context) ([]UserLimit, error)
	Update(ctx context.Context, limit UserLimit) error
	Delete(ctx context.Context, userID, limitKey string) error
}

