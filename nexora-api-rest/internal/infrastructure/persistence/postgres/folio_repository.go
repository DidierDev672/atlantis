package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/domain/billing"
)

// FolioSchemaDDL defines the 3 PostgreSQL tables for the billing module:
// folios, folio_charges, and folio_payments, along with CHECK constraints and partial unique indexes.
const FolioSchemaDDL = `
CREATE TABLE IF NOT EXISTS folios (
    id          VARCHAR(36) PRIMARY KEY,
    reserve_id  VARCHAR(36),
    stay_id     VARCHAR(36),
    payer_id    VARCHAR(36) NOT NULL,
    currency    VARCHAR(5)  NOT NULL DEFAULT 'COP',
    status      VARCHAR(20) NOT NULL DEFAULT 'open',
    created_by  VARCHAR(100) NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (reserve_id IS NOT NULL OR stay_id IS NOT NULL),
    CHECK (status IN ('open', 'settled', 'closed', 'void'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_folios_stay_active
    ON folios(stay_id)
    WHERE stay_id IS NOT NULL AND status <> 'void';
CREATE INDEX IF NOT EXISTS idx_folios_reserve_id ON folios(reserve_id);
CREATE INDEX IF NOT EXISTS idx_folios_payer_id ON folios(payer_id);

CREATE TABLE IF NOT EXISTS folio_charges (
    id          VARCHAR(36) PRIMARY KEY,
    folio_id    VARCHAR(36) NOT NULL REFERENCES folios(id) ON DELETE RESTRICT,
    type        VARCHAR(30) NOT NULL,
    source_type VARCHAR(50),
    source_id   VARCHAR(50),
    description TEXT NOT NULL DEFAULT '',
    subtotal    BIGINT NOT NULL,
    taxes       BIGINT NOT NULL DEFAULT 0,
    total       BIGINT NOT NULL,
    void_reason TEXT NOT NULL DEFAULT '',
    posted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    voided_at   TIMESTAMPTZ,
    created_by  VARCHAR(100) NOT NULL DEFAULT '',
    CHECK (type IN ('lodging', 'room_service', 'penalty', 'adjustment'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_folio_charges_source_active
    ON folio_charges(folio_id, source_type, source_id)
    WHERE source_id IS NOT NULL AND voided_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_folio_charges_folio_id ON folio_charges(folio_id);

CREATE TABLE IF NOT EXISTS folio_payments (
    id              VARCHAR(36) PRIMARY KEY,
    folio_id        VARCHAR(36) NOT NULL REFERENCES folios(id) ON DELETE RESTRICT,
    paid_by         VARCHAR(36) NOT NULL,
    kind            VARCHAR(20) NOT NULL,
    method          VARCHAR(30) NOT NULL,
    amount          BIGINT NOT NULL CHECK (amount > 0),
    reference       TEXT NOT NULL DEFAULT '',
    idempotency_key TEXT NOT NULL UNIQUE,
    received_by     VARCHAR(100) NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (kind IN ('advance', 'deposit', 'payment', 'refund')),
    CHECK (method IN ('cash', 'card', 'bank_transfer'))
);
CREATE INDEX IF NOT EXISTS idx_folio_payments_folio_id ON folio_payments(folio_id);
`

// FolioRepository is the PostgreSQL adapter for billing.FolioRepository.
type FolioRepository struct {
	conn      *pgxpool.Pool
	initOnce  sync.Once
	initError error
}

// NewFolioRepository instantiates a new FolioRepository backed by pgxpool.
func NewFolioRepository(conn *pgxpool.Pool) *FolioRepository {
	return &FolioRepository{conn: conn}
}

var _ billing.FolioRepository = (*FolioRepository)(nil)

// EnsureTable creates the billing tables and indexes idempotently using sync.Once.
func (r *FolioRepository) EnsureTable(ctx context.Context) error {
	r.initOnce.Do(func() {
		_, r.initError = r.conn.Exec(ctx, FolioSchemaDDL)
	})
	return r.initError
}

// Create inserts a new Folio and any initial charges/payments inside a single transaction.
func (r *FolioRepository) Create(ctx context.Context, f billing.Folio) error {
	if err := r.EnsureTable(ctx); err != nil {
		return fmt.Errorf("ensure billing tables: %w", err)
	}

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin create folio tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var reservePtr, stayPtr *string
	if f.ReserveID != nil && strings.TrimSpace(string(*f.ReserveID)) != "" {
		s := strings.TrimSpace(string(*f.ReserveID))
		reservePtr = &s
	}
	if f.StayID != nil && strings.TrimSpace(string(*f.StayID)) != "" {
		s := strings.TrimSpace(string(*f.StayID))
		stayPtr = &s
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO folios (id, reserve_id, stay_id, payer_id, currency, status, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`,
		string(f.ID),
		reservePtr,
		stayPtr,
		string(f.PayerID),
		f.Currency,
		string(f.Status),
		f.CreatedBy,
		f.CreatedAt,
		f.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert folio: %w", err)
	}

	for _, c := range f.Charges {
		if err := insertChargeTx(ctx, tx, c); err != nil {
			return err
		}
	}

	for _, p := range f.Payments {
		if err := insertPaymentTx(ctx, tx, p); err != nil {
			return err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit create folio tx: %w", err)
	}
	return nil
}

// GetByID retrieves a Folio by its ID along with all its charges and payments.
func (r *FolioRepository) GetByID(ctx context.Context, id billing.FolioID) (billing.Folio, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return billing.Folio{}, fmt.Errorf("ensure billing tables: %w", err)
	}

	row := r.conn.QueryRow(ctx, `
		SELECT id, reserve_id, stay_id, payer_id, currency, status, created_by, created_at, updated_at
		FROM folios
		WHERE id = $1
	`, string(id))

	f, err := scanFolioHeader(row)
	if err != nil {
		return billing.Folio{}, err
	}

	if err := r.loadChildren(ctx, r.conn, &f); err != nil {
		return billing.Folio{}, err
	}
	return f, nil
}

// GetOpenByStayID retrieves the active (non-void) Folio linked to a StayID.
func (r *FolioRepository) GetOpenByStayID(ctx context.Context, stayID domain.StayID) (billing.Folio, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return billing.Folio{}, fmt.Errorf("ensure billing tables: %w", err)
	}

	row := r.conn.QueryRow(ctx, `
		SELECT id, reserve_id, stay_id, payer_id, currency, status, created_by, created_at, updated_at
		FROM folios
		WHERE stay_id = $1 AND status <> 'void'
		ORDER BY created_at DESC
		LIMIT 1
	`, string(stayID))

	f, err := scanFolioHeader(row)
	if err != nil {
		return billing.Folio{}, err
	}

	if err := r.loadChildren(ctx, r.conn, &f); err != nil {
		return billing.Folio{}, err
	}
	return f, nil
}

// GetByReserveID retrieves the latest non-void Folio linked to a ReserveID.
func (r *FolioRepository) GetByReserveID(ctx context.Context, reserveID domain.ReserveID) (billing.Folio, error) {
	if err := r.EnsureTable(ctx); err != nil {
		return billing.Folio{}, fmt.Errorf("ensure billing tables: %w", err)
	}

	row := r.conn.QueryRow(ctx, `
		SELECT id, reserve_id, stay_id, payer_id, currency, status, created_by, created_at, updated_at
		FROM folios
		WHERE reserve_id = $1 AND status <> 'void'
		ORDER BY created_at DESC
		LIMIT 1
	`, string(reserveID))

	f, err := scanFolioHeader(row)
	if err != nil {
		return billing.Folio{}, err
	}

	if err := r.loadChildren(ctx, r.conn, &f); err != nil {
		return billing.Folio{}, err
	}
	return f, nil
}

// Mutate locks the Folio row with SELECT ... FOR UPDATE, loads its charges and payments,
// executes fn(&folio), and atomically persists any new charges, voided charges, new payments, and header changes.
func (r *FolioRepository) Mutate(ctx context.Context, id billing.FolioID, fn func(*billing.Folio) error) error {
	if err := r.EnsureTable(ctx); err != nil {
		return fmt.Errorf("ensure billing tables: %w", err)
	}

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin mutate folio tx: %w", err)
	}
	defer tx.Rollback(ctx)

	row := tx.QueryRow(ctx, `
		SELECT id, reserve_id, stay_id, payer_id, currency, status, created_by, created_at, updated_at
		FROM folios
		WHERE id = $1
		FOR UPDATE
	`, string(id))

	f, err := scanFolioHeader(row)
	if err != nil {
		return err
	}

	if err := r.loadChildren(ctx, tx, &f); err != nil {
		return err
	}

	existingCharges := make(map[billing.ChargeID]billing.Charge, len(f.Charges))
	for _, c := range f.Charges {
		existingCharges[c.ID] = c
	}
	existingPayments := make(map[billing.PaymentID]struct{}, len(f.Payments))
	for _, p := range f.Payments {
		existingPayments[p.ID] = struct{}{}
	}

	if err := fn(&f); err != nil {
		return err
	}

	var reservePtr, stayPtr *string
	if f.ReserveID != nil && strings.TrimSpace(string(*f.ReserveID)) != "" {
		s := strings.TrimSpace(string(*f.ReserveID))
		reservePtr = &s
	}
	if f.StayID != nil && strings.TrimSpace(string(*f.StayID)) != "" {
		s := strings.TrimSpace(string(*f.StayID))
		stayPtr = &s
	}

	_, err = tx.Exec(ctx, `
		UPDATE folios
		SET reserve_id = $2,
		    stay_id    = $3,
		    payer_id   = $4,
		    currency   = $5,
		    status     = $6,
		    updated_at = $7
		WHERE id = $1
	`,
		string(f.ID),
		reservePtr,
		stayPtr,
		string(f.PayerID),
		f.Currency,
		string(f.Status),
		f.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("update folio header: %w", err)
	}

	for _, c := range f.Charges {
		prev, existed := existingCharges[c.ID]
		if !existed {
			if err := insertChargeTx(ctx, tx, c); err != nil {
				return err
			}
		} else if prev.VoidedAt == nil && c.VoidedAt != nil {
			_, err := tx.Exec(ctx, `
				UPDATE folio_charges
				SET voided_at = $2, void_reason = $3
				WHERE id = $1
			`, string(c.ID), c.VoidedAt, c.VoidReason)
			if err != nil {
				return fmt.Errorf("void charge in db: %w", err)
			}
		}
	}

	for _, p := range f.Payments {
		if _, existed := existingPayments[p.ID]; !existed {
			if err := insertPaymentTx(ctx, tx, p); err != nil {
				return err
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit mutate folio tx: %w", err)
	}
	return nil
}

type queryRunner interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
}

func (r *FolioRepository) loadChildren(ctx context.Context, q queryRunner, f *billing.Folio) error {
	chargeRows, err := q.Query(ctx, `
		SELECT id, folio_id, type, COALESCE(source_type, ''), COALESCE(source_id, ''),
		       description, subtotal, taxes, total, void_reason, posted_at, voided_at, created_by
		FROM folio_charges
		WHERE folio_id = $1
		ORDER BY posted_at ASC, id ASC
	`, string(f.ID))
	if err != nil {
		return fmt.Errorf("query folio charges: %w", err)
	}
	defer chargeRows.Close()

	charges := make([]billing.Charge, 0)
	for chargeRows.Next() {
		var c billing.Charge
		var idStr, folioIDStr, typeStr string
		if err := chargeRows.Scan(
			&idStr,
			&folioIDStr,
			&typeStr,
			&c.SourceType,
			&c.SourceID,
			&c.Description,
			&c.Subtotal,
			&c.Taxes,
			&c.Total,
			&c.VoidReason,
			&c.PostedAt,
			&c.VoidedAt,
			&c.CreatedBy,
		); err != nil {
			return fmt.Errorf("scan folio charge: %w", err)
		}
		c.ID = billing.ChargeID(idStr)
		c.FolioID = billing.FolioID(folioIDStr)
		c.Type = billing.ChargeType(typeStr)
		charges = append(charges, c)
	}
	if err := chargeRows.Err(); err != nil {
		return fmt.Errorf("iterate folio charges: %w", err)
	}
	f.Charges = charges

	paymentRows, err := q.Query(ctx, `
		SELECT id, folio_id, paid_by, kind, method, amount, reference, idempotency_key, received_by, created_at
		FROM folio_payments
		WHERE folio_id = $1
		ORDER BY created_at ASC, id ASC
	`, string(f.ID))
	if err != nil {
		return fmt.Errorf("query folio payments: %w", err)
	}
	defer paymentRows.Close()

	payments := make([]billing.Payment, 0)
	for paymentRows.Next() {
		var p billing.Payment
		var idStr, folioIDStr, paidByStr, kindStr, methodStr string
		if err := paymentRows.Scan(
			&idStr,
			&folioIDStr,
			&paidByStr,
			&kindStr,
			&methodStr,
			&p.Amount,
			&p.Reference,
			&p.IdempotencyKey,
			&p.ReceivedBy,
			&p.CreatedAt,
		); err != nil {
			return fmt.Errorf("scan folio payment: %w", err)
		}
		p.ID = billing.PaymentID(idStr)
		p.FolioID = billing.FolioID(folioIDStr)
		p.PaidBy = domain.PersonID(paidByStr)
		p.Kind = billing.PaymentKind(kindStr)
		p.Method = billing.PaymentMethod(methodStr)
		payments = append(payments, p)
	}
	if err := paymentRows.Err(); err != nil {
		return fmt.Errorf("iterate folio payments: %w", err)
	}
	f.Payments = payments

	return nil
}

func scanFolioHeader(row pgx.Row) (billing.Folio, error) {
	var f billing.Folio
	var idStr, payerIDStr, statusStr string
	var reserveIDPtr, stayIDPtr *string

	err := row.Scan(
		&idStr,
		&reserveIDPtr,
		&stayIDPtr,
		&payerIDStr,
		&f.Currency,
		&statusStr,
		&f.CreatedBy,
		&f.CreatedAt,
		&f.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return billing.Folio{}, billing.ErrFolioNotFound
		}
		return billing.Folio{}, fmt.Errorf("scan folio header: %w", err)
	}

	f.ID = billing.FolioID(idStr)
	if reserveIDPtr != nil && *reserveIDPtr != "" {
		r := domain.ReserveID(*reserveIDPtr)
		f.ReserveID = &r
	}
	if stayIDPtr != nil && *stayIDPtr != "" {
		s := domain.StayID(*stayIDPtr)
		f.StayID = &s
	}
	f.PayerID = domain.PersonID(payerIDStr)
	f.Status = billing.FolioStatus(statusStr)
	return f, nil
}

func insertChargeTx(ctx context.Context, tx pgx.Tx, c billing.Charge) error {
	var srcType, srcID *string
	if strings.TrimSpace(c.SourceType) != "" {
		st := strings.TrimSpace(c.SourceType)
		srcType = &st
	}
	if strings.TrimSpace(c.SourceID) != "" {
		sid := strings.TrimSpace(c.SourceID)
		srcID = &sid
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO folio_charges (
			id, folio_id, type, source_type, source_id, description,
			subtotal, taxes, total, void_reason, posted_at, voided_at, created_by
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`,
		string(c.ID),
		string(c.FolioID),
		string(c.Type),
		srcType,
		srcID,
		c.Description,
		int64(c.Subtotal),
		int64(c.Taxes),
		int64(c.Total),
		c.VoidReason,
		c.PostedAt,
		c.VoidedAt,
		c.CreatedBy,
	)
	if err != nil {
		return fmt.Errorf("insert folio charge: %w", err)
	}
	return nil
}

func insertPaymentTx(ctx context.Context, tx pgx.Tx, p billing.Payment) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO folio_payments (
			id, folio_id, paid_by, kind, method, amount,
			reference, idempotency_key, received_by, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`,
		string(p.ID),
		string(p.FolioID),
		string(p.PaidBy),
		string(p.Kind),
		string(p.Method),
		int64(p.Amount),
		p.Reference,
		p.IdempotencyKey,
		p.ReceivedBy,
		p.CreatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return billing.ErrDuplicatePayment
		}
		return fmt.Errorf("insert folio payment: %w", err)
	}
	return nil
}
