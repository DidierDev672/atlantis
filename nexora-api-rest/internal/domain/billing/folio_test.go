package billing_test

import (
	"errors"
	"testing"
	"time"

	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/domain/billing"
)

func TestFolio_DomainRules(t *testing.T) {
	now := time.Date(2026, 11, 16, 12, 0, 0, 0, time.UTC)
	stayID := domain.StayID("stay-101")
	resID := domain.ReserveID("res-101")
	payerID := domain.PersonID("person-1")

	t.Run("requires at least one of reserve_id or stay_id", func(t *testing.T) {
		_, err := billing.NewFolio("f-1", nil, nil, payerID, "COP", "staff@hotel.com", now)
		if !errors.Is(err, billing.ErrMissingFolioAnchor) {
			t.Fatalf("expected ErrMissingFolioAnchor, got %v", err)
		}
	})

	t.Run("lodging only vs lodging with room service, voided charges, payments and refunds", func(t *testing.T) {
		f, err := billing.NewFolio("f-1", &resID, &stayID, payerID, "COP", "staff@hotel.com", now)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		// Case A: Guest only stayed (lodging charge 200,000.00 COP -> 20000000 cents)
		_, err = f.PostCharge("ch-lodging", billing.ChargeTypeLodging, "stay", "stay-101", "Alojamiento 2 noches", 20000000, 0, 20000000, "staff@hotel.com", now)
		if err != nil {
			t.Fatalf("post lodging failed: %v", err)
		}
		if f.Balance() != 20000000 {
			t.Fatalf("expected balance 20000000, got %d", f.Balance())
		}

		// Case B: Guest orders Room Service (idempotent by SourceType + SourceID)
		c1, err := f.PostCharge("ch-rs-1", billing.ChargeTypeRoomService, "service_request", "sr-84", "Room Service #84", 4300000, 430000, 4730000, "staff@hotel.com", now)
		if err != nil {
			t.Fatalf("post room service failed: %v", err)
		}
		// Duplicate PostCharge with same (source_type, source_id) must be idempotent
		cDup, err := f.PostCharge("ch-rs-dup", billing.ChargeTypeRoomService, "service_request", "sr-84", "Room Service #84", 4300000, 430000, 4730000, "staff@hotel.com", now)
		if err != nil {
			t.Fatalf("idempotent post charge failed: %v", err)
		}
		if cDup.ID != c1.ID || len(f.Charges) != 2 {
			t.Fatalf("expected idempotent charge %s and 2 total charges, got %s and %d", c1.ID, cDup.ID, len(f.Charges))
		}
		if f.Balance() != 24730000 {
			t.Fatalf("expected balance 24730000, got %d", f.Balance())
		}

		// Post penalty and then void it
		_, err = f.PostCharge("ch-pen", billing.ChargeTypePenalty, "", "", "Minibar rotura", 1000000, 0, 1000000, "staff@hotel.com", now)
		if err != nil {
			t.Fatalf("post penalty failed: %v", err)
		}
		if _, err := f.VoidCharge("ch-pen", "Error de habitación", now); err != nil {
			t.Fatalf("void charge failed: %v", err)
		}
		if f.Balance() != 24730000 {
			t.Fatalf("expected balance 24730000 after void, got %d", f.Balance())
		}

		// Close with pending balance > 0 must fail
		if err := f.Close(now); !errors.Is(err, billing.ErrPendingBalance) {
			t.Fatalf("expected ErrPendingBalance, got %v", err)
		}

		// Register advance payment (10,000,000) + full payment (15,000,000) + refund (270,000) = 24,730,000 net paid
		if _, err := f.RegisterPayment("pay-1", payerID, billing.PaymentKindAdvance, billing.PaymentMethodCard, 10000000, "AUTH-1", "idem-1", "staff@hotel.com", now); err != nil {
			t.Fatalf("register advance failed: %v", err)
		}
		if _, err := f.RegisterPayment("pay-2", "company-payer", billing.PaymentKindPayment, billing.PaymentMethodBankTransfer, 15000000, "TRX-2", "idem-2", "staff@hotel.com", now); err != nil {
			t.Fatalf("register payment failed: %v", err)
		}
		// Refund exceeding paid must fail
		if _, err := f.RegisterPayment("pay-ref-bad", payerID, billing.PaymentKindRefund, billing.PaymentMethodCash, 30000000, "REF-BAD", "idem-bad", "staff@hotel.com", now); !errors.Is(err, billing.ErrRefundExceedsPaid) {
			t.Fatalf("expected ErrRefundExceedsPaid, got %v", err)
		}
		// Valid refund bringing balance to 0 -> transitions status to settled
		if _, err := f.RegisterPayment("pay-ref", payerID, billing.PaymentKindRefund, billing.PaymentMethodCash, 270000, "REF-OK", "idem-3", "staff@hotel.com", now); err != nil {
			t.Fatalf("register refund failed: %v", err)
		}
		if f.Balance() != 0 {
			t.Fatalf("expected balance 0, got %d", f.Balance())
		}
		if f.Status != billing.FolioStatusSettled {
			t.Fatalf("expected status settled, got %s", f.Status)
		}

		// Close folio when balance == 0
		if err := f.Close(now); err != nil {
			t.Fatalf("unexpected error closing folio: %v", err)
		}
		if f.Status != billing.FolioStatusClosed {
			t.Fatalf("expected status closed, got %s", f.Status)
		}

		// Closed folio is immutable
		if _, err := f.PostCharge("ch-after", billing.ChargeTypePenalty, "", "", "Extra", 100, 0, 100, "staff", now); !errors.Is(err, billing.ErrFolioImmutable) {
			t.Fatalf("expected ErrFolioImmutable on closed folio, got %v", err)
		}
	})
}
