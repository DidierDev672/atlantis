package rolelimit

import (
	"context"
)

// Repository define el puerto secundario de persistencia para RoleLimit (DIP + ISP).
// Es agnóstico a cualquier base de datos o tecnología subyacente.
type Repository interface {
	// EnsureTable crea de forma idempotente la tabla en la base de datos si no existe.
	EnsureTable(ctx context.Context) error
	Create(ctx context.Context, limit RoleLimit) error
	Get(ctx context.Context, roleID, limitKey string) (RoleLimit, error)
	ListByRole(ctx context.Context, roleID string) ([]RoleLimit, error)
	ListAll(ctx context.Context) ([]RoleLimit, error)
	Update(ctx context.Context, limit RoleLimit) error
	Delete(ctx context.Context, roleID, limitKey string) error
}

