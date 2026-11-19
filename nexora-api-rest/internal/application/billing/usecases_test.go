package billing_test

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	billingapp "nexora-api-rest/internal/application/billing"
	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/domain/billing"
)

type fakeFolioRepo struct {
	folios map[billing.FolioID]billing.Folio
}

func newFakeFolioRepo() *fakeFolioRepo {
	return &fakeFolioRepo{folios: make(map[billing.FolioID]billing.Folio)}
}

func (r *fakeFolioRepo) EnsureTable(ctx context.Context) error { return nil }

func (r *fakeFolioRepo) Create(ctx context.Context, f billing.Folio) error {
	r.folios[f.ID] = f
	return nil
}

func (r *fakeFolioRepo) GetByID(ctx context.Context, id billing.FolioID) (billing.Folio, error) {
	f, ok := r.folios[id]
	if !ok {
		return billing.Folio{}, billing.ErrFolioNotFound
	}
	return f, nil
}

func (r *fakeFolioRepo) GetOpenByStayID(ctx context.Context, stayID domain.StayID) (billing.Folio, error) {
	for _, f := range r.folios {
		if f.StayID != nil && *f.StayID == stayID && f.Status != billing.FolioStatusVoid {
			return f, nil
		}
	}
	return billing.Folio{}, billing.ErrFolioNotFound
}

func (r *fakeFolioRepo) GetByReserveID(ctx context.Context, reserveID domain.ReserveID) (billing.Folio, error) {
	for _, f := range r.folios {
		if f.ReserveID != nil && *f.ReserveID == reserveID && f.Status != billing.FolioStatusVoid {
			return f, nil
		}
	}
	return billing.Folio{}, billing.ErrFolioNotFound
}

func (r *fakeFolioRepo) Mutate(ctx context.Context, id billing.FolioID, fn func(*billing.Folio) error) error {
	f, ok := r.folios[id]
	if !ok {
		return billing.ErrFolioNotFound
	}
	charges := append([]billing.Charge(nil), f.Charges...)
	payments := append([]billing.Payment(nil), f.Payments...)
	f.Charges = charges
	f.Payments = payments

	if err := fn(&f); err != nil {
		return err
	}
	r.folios[id] = f
	return nil
}

type fakeStayRepo struct {
	stays map[domain.StayID]domain.Stay
}

func (s *fakeStayRepo) FindByID(ctx context.Context, id domain.StayID) (domain.Stay, error) {
	st, ok := s.stays[id]
	if !ok {
		return domain.Stay{}, domain.ErrStayNotFound
	}
	return st, nil
}

func (s *fakeStayRepo) Update(ctx context.Context, stay domain.Stay) (domain.Stay, error) {
	s.stays[stay.ID] = stay
	return stay, nil
}

type fakeReserveRepo struct {
	reserves map[domain.ReserveID]domain.Reserve
}

func (r *fakeReserveRepo) FindByID(ctx context.Context, id domain.ReserveID) (domain.Reserve, error) {
	res, ok := r.reserves[id]
	if !ok {
		return domain.Reserve{}, domain.ErrReserveNotFound
	}
	return res, nil
}

func (r *fakeReserveRepo) Update(ctx context.Context, reserve domain.Reserve) (domain.Reserve, error) {
	r.reserves[reserve.ID] = reserve
	return reserve, nil
}

type seqIDGen struct {
	seq int
}

func (g *seqIDGen) next(prefix string) string {
	g.seq++
	return fmt.Sprintf("%s-%d", prefix, g.seq)
}
func (g *seqIDGen) NewFolioID() billing.FolioID     { return billing.FolioID(g.next("folio")) }
func (g *seqIDGen) NewChargeID() billing.ChargeID   { return billing.ChargeID(g.next("charge")) }
func (g *seqIDGen) NewPaymentID() billing.PaymentID { return billing.PaymentID(g.next("pay")) }

func TestUseCase_EndToEndFlows(t *testing.T) {
	ctx := domain.WithActor(context.Background(), domain.Actor{Email: "reception@nexora.com"})
	now := time.Date(2026, 11, 16, 10, 0, 0, 0, time.UTC)

	folioRepo := newFakeFolioRepo()
	resID := domain.ReserveID("res-500")
	stayID := domain.StayID("stay-500")
	payerID := domain.PersonID("guest-500")

	reserveRepo := &fakeReserveRepo{
		reserves: map[domain.ReserveID]domain.Reserve{
			resID: {
				ID:             resID,
				RoomID:         "room-101",
				PersonID:       payerID,
				PersonIDs:      []domain.PersonID{payerID},
				CheckInDate:    now,
				CheckOutDate:   now.Add(48 * time.Hour),
				NumberOfGuests: 2,
				State:          domain.ReserveStateConfirmed,
				TotalPrice:     300000, // 300,000 COP major units -> 30,000,000 cents
			},
		},
	}

	stayRepo := &fakeStayRepo{
		stays: map[domain.StayID]domain.Stay{
			stayID: {
				ID:              stayID,
				RoomID:          "room-101",
				ReservationID:   resID,
				PersonIDs:       []domain.PersonID{payerID},
				CheckInDate:     now,
				CheckOutDate:    now.Add(48 * time.Hour),
				PaymentMethod:   domain.PaymentMethodCash,
				SecurityDeposit: 50000, // 50,000 COP major units -> 5,000,000 cents
				Status:          domain.StayStatusProgress,
			},
		},
	}

	uc := billingapp.NewUseCase(folioRepo, stayRepo, reserveRepo, nil, &seqIDGen{}, nil)

	// 1. Open folio at reservation stage and record an advance payment
	fRes, err := uc.OpenFolio(ctx, billingapp.OpenFolioInput{
		ReserveID: &resID,
		PayerID:   payerID,
		Currency:  "COP",
	})
	if err != nil {
		t.Fatalf("open reserve folio failed: %v", err)
	}

	_, pay1, err := uc.RegisterPayment(ctx, billingapp.RegisterPaymentInput{
		FolioID:        fRes.ID,
		PaidBy:         payerID,
		Kind:           "advance",
		Method:         "card",
		Amount:         10000000, // 100,000.00 COP
		Reference:      "ADV-1",
		IdempotencyKey: "key-adv-1",
	})
	if err != nil {
		t.Fatalf("register advance failed: %v", err)
	}
	// Idempotent replay with same key returns same payment
	_, payReplay, err := uc.RegisterPayment(ctx, billingapp.RegisterPaymentInput{
		FolioID:        fRes.ID,
		PaidBy:         payerID,
		Kind:           "advance",
		Method:         "card",
		Amount:         10000000,
		Reference:      "ADV-1",
		IdempotencyKey: "key-adv-1",
	})
	if err != nil || payReplay.ID != pay1.ID {
		t.Fatalf("expected idempotent payment %s, got %s (err=%v)", pay1.ID, payReplay.ID, err)
	}

	// 2. Open folio at Check-In (links existing reserve folio to StayID)
	fStay, err := uc.OpenFolio(ctx, billingapp.OpenFolioInput{
		StayID:   &stayID,
		PayerID:  payerID,
		Currency: "COP",
	})
	if err != nil {
		t.Fatalf("open stay folio failed: %v", err)
	}
	if fStay.ID != fRes.ID || fStay.StayID == nil || *fStay.StayID != stayID {
		t.Fatalf("expected reserve folio %s to be linked to stay %s", fRes.ID, stayID)
	}

	// 3. Deliver a Room Service order -> adds room_service charge (4,730,000 cents)
	snap := billingapp.ServiceRequestSnapshot{
		ID:          "sr-84",
		OrderNumber: "84",
		Status:      "delivered",
		Currency:    "COP",
		PersonID:    payerID,
		Subtotal:    4300000,
		Taxes:       430000,
		Total:       4730000,
	}
	if err := uc.PostServiceRequestCharge(ctx, stayID, snap); err != nil {
		t.Fatalf("post service request charge failed: %v", err)
	}

	// 4. Checkout without paying full remaining balance must fail with ErrPendingBalance
	// Lodging (30,000,000) + RoomService (4,730,000) - Advance (10,000,000) - Deposit (5,000,000) = 19,730,000 pending
	_, err = uc.Checkout(ctx, stayID, nil)
	if !errors.Is(err, billing.ErrPendingBalance) {
		t.Fatalf("expected ErrPendingBalance on unpaid checkout, got %v", err)
	}

	// 5. Checkout with final payment of 19,730,000 succeeds and completes Stay and Reserve
	closed, err := uc.Checkout(ctx, stayID, &billingapp.CheckoutPaymentInput{
		PaidBy:         payerID,
		Method:         "card",
		Amount:         19730000,
		Reference:      "FINAL-CHK",
		IdempotencyKey: "chk-key-1",
	})
	if err != nil {
		t.Fatalf("checkout with final payment failed: %v", err)
	}
	if closed.Status != billing.FolioStatusClosed || closed.Balance() != 0 {
		t.Fatalf("expected closed folio with 0 balance, got status=%s balance=%d", closed.Status, closed.Balance())
	}
	if stayRepo.stays[stayID].Status != domain.StayStatusCompleted {
		t.Fatalf("expected stay completed, got %s", stayRepo.stays[stayID].Status)
	}
	if reserveRepo.reserves[resID].State != domain.ReserveStateCompleted {
		t.Fatalf("expected reserve completed, got %s", reserveRepo.reserves[resID].State)
	}
}
