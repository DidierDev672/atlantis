package billing

import (
	"context"
	"time"

	"nexora-api-rest/internal/domain"
)

// FolioRepository defines the secondary persistence port for the Folio aggregate.
type FolioRepository interface {
	EnsureTable(ctx context.Context) error
	Create(ctx context.Context, f Folio) error
	GetByID(ctx context.Context, id FolioID) (Folio, error)
	GetOpenByStayID(ctx context.Context, id domain.StayID) (Folio, error)
	GetByReserveID(ctx context.Context, id domain.ReserveID) (Folio, error)
	// Mutate executes fn inside a database transaction with SELECT ... FOR UPDATE on the folio
	// and atomically persists new charges, voided charges, new payments, and folio state updates.
	Mutate(ctx context.Context, id FolioID, fn func(*Folio) error) error
}

// IDGenerator abstracts identifier generation for billing entities.
type IDGenerator interface {
	NewFolioID() FolioID
	NewChargeID() ChargeID
	NewPaymentID() PaymentID
}

// Clock abstracts current UTC time retrieval for deterministic testing.
type Clock interface {
	Now() time.Time
}
