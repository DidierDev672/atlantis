package billing_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	billinghttp "nexora-api-rest/internal/api/billing"
	billingapp "nexora-api-rest/internal/application/billing"
	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/domain/billing"
)

type memFolioRepo struct {
	folios map[billing.FolioID]billing.Folio
}

func newMemFolioRepo() *memFolioRepo {
	return &memFolioRepo{folios: make(map[billing.FolioID]billing.Folio)}
}
func (r *memFolioRepo) EnsureTable(ctx context.Context) error { return nil }
func (r *memFolioRepo) Create(ctx context.Context, f billing.Folio) error {
	r.folios[f.ID] = f
	return nil
}
func (r *memFolioRepo) GetByID(ctx context.Context, id billing.FolioID) (billing.Folio, error) {
	f, ok := r.folios[id]
	if !ok {
		return billing.Folio{}, billing.ErrFolioNotFound
	}
	return f, nil
}
func (r *memFolioRepo) GetOpenByStayID(ctx context.Context, stayID domain.StayID) (billing.Folio, error) {
	for _, f := range r.folios {
		if f.StayID != nil && *f.StayID == stayID && f.Status != billing.FolioStatusVoid {
			return f, nil
		}
	}
	return billing.Folio{}, billing.ErrFolioNotFound
}
func (r *memFolioRepo) GetByReserveID(ctx context.Context, reserveID domain.ReserveID) (billing.Folio, error) {
	for _, f := range r.folios {
		if f.ReserveID != nil && *f.ReserveID == reserveID && f.Status != billing.FolioStatusVoid {
			return f, nil
		}
	}
	return billing.Folio{}, billing.ErrFolioNotFound
}
func (r *memFolioRepo) Mutate(ctx context.Context, id billing.FolioID, fn func(*billing.Folio) error) error {
	f, ok := r.folios[id]
	if !ok {
		return billing.ErrFolioNotFound
	}
	f.Charges = append([]billing.Charge(nil), f.Charges...)
	f.Payments = append([]billing.Payment(nil), f.Payments...)
	if err := fn(&f); err != nil {
		return err
	}
	r.folios[id] = f
	return nil
}

type memStayRepo struct {
	stays map[domain.StayID]domain.Stay
}

func (s *memStayRepo) FindByID(ctx context.Context, id domain.StayID) (domain.Stay, error) {
	st, ok := s.stays[id]
	if !ok {
		return domain.Stay{}, domain.ErrStayNotFound
	}
	return st, nil
}
func (s *memStayRepo) Update(ctx context.Context, stay domain.Stay) (domain.Stay, error) {
	s.stays[stay.ID] = stay
	return stay, nil
}

type testIDGen struct {
	n int
}

func (g *testIDGen) next(p string) string {
	g.n++
	return fmt.Sprintf("%s-%d", p, g.n)
}
func (g *testIDGen) NewFolioID() billing.FolioID     { return billing.FolioID(g.next("folio")) }
func (g *testIDGen) NewChargeID() billing.ChargeID   { return billing.ChargeID(g.next("chg")) }
func (g *testIDGen) NewPaymentID() billing.PaymentID { return billing.PaymentID(g.next("pay")) }

func TestHandler_AllNineEndpoints(t *testing.T) {
	now := time.Date(2026, 11, 16, 14, 0, 0, 0, time.UTC)
	repo := newMemFolioRepo()
	stayRepo := &memStayRepo{
		stays: map[domain.StayID]domain.Stay{
			"stay-99": {
				ID:              "stay-99",
				RoomID:          "room-10",
				PersonIDs:       []domain.PersonID{"guest-99"},
				CheckInDate:     now,
				CheckOutDate:    now.Add(24 * time.Hour),
				PaymentMethod:   domain.PaymentMethodCash,
				SecurityDeposit: 100, // 10,000 cents
				Status:          domain.StayStatusProgress,
			},
		},
	}

	uc := billingapp.NewUseCase(repo, stayRepo, nil, nil, &testIDGen{}, nil)
	h := billinghttp.NewHandler(uc)
	mux := http.NewServeMux()
	h.Register(mux)

	// 1. POST /folios
	openBody := []byte(`{"stay_id":"stay-99","payer_id":"guest-99","currency":"COP"}`)
	req := httptest.NewRequest(http.MethodPost, "/folios", bytes.NewReader(openBody))
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("POST /folios expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var folioResp billinghttp.FolioResponse
	if err := json.Unmarshal(w.Body.Bytes(), &folioResp); err != nil {
		t.Fatalf("unmarshal folio response: %v", err)
	}
	folioID := folioResp.ID

	// 2. GET /folios/{id}
	req = httptest.NewRequest(http.MethodGet, "/folios/"+folioID, nil)
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("GET /folios/{id} expected 200, got %d", w.Code)
	}

	// 3. GET /folios?stay_id=stay-99
	req = httptest.NewRequest(http.MethodGet, "/folios?stay_id=stay-99", nil)
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("GET /folios?stay_id expected 200, got %d", w.Code)
	}

	// 4. POST /folios/{id}/charges
	chargeBody := []byte(`{"type":"lodging","description":"Noche 1","subtotal":50000,"taxes":0,"total":50000}`)
	req = httptest.NewRequest(http.MethodPost, "/folios/"+folioID+"/charges", bytes.NewReader(chargeBody))
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("POST /folios/{id}/charges expected 201, got %d: %s", w.Code, w.Body.String())
	}

	// Post a penalty charge to test voiding
	penBody := []byte(`{"type":"penalty","description":"Toalla","subtotal":10000,"taxes":0,"total":10000}`)
	req = httptest.NewRequest(http.MethodPost, "/folios/"+folioID+"/charges", bytes.NewReader(penBody))
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	_ = json.Unmarshal(w.Body.Bytes(), &folioResp)
	penChargeID := folioResp.Charges[1].ID

	// 5. POST /folios/{id}/charges/{chargeId}/void
	voidBody := []byte(`{"reason":"Cortesía gerencia"}`)
	req = httptest.NewRequest(http.MethodPost, "/folios/"+folioID+"/charges/"+penChargeID+"/void", bytes.NewReader(voidBody))
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("POST void charge expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// 6. GET /folios/{id}/balance
	req = httptest.NewRequest(http.MethodGet, "/folios/"+folioID+"/balance", nil)
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("GET balance expected 200, got %d", w.Code)
	}

	// 7. POST /folios/{id}/payments (missing Idempotency-Key header must return 400)
	payBody := []byte(`{"paid_by":"guest-99","kind":"payment","method":"card","amount":20000,"reference":"POS-1"}`)
	req = httptest.NewRequest(http.MethodPost, "/folios/"+folioID+"/payments", bytes.NewReader(payBody))
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("POST payment without Idempotency-Key expected 400, got %d", w.Code)
	}

	// Now with Idempotency-Key header
	req = httptest.NewRequest(http.MethodPost, "/folios/"+folioID+"/payments", bytes.NewReader(payBody))
	req.Header.Set("Idempotency-Key", "idem-http-1")
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("POST payment expected 201, got %d: %s", w.Code, w.Body.String())
	}

	// 8. POST /folios/{id}/close with pending balance > 0 must return 409 Conflict
	req = httptest.NewRequest(http.MethodPost, "/folios/"+folioID+"/close", nil)
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusConflict {
		t.Fatalf("POST close with pending balance expected 409, got %d: %s", w.Code, w.Body.String())
	}

	// 9. POST /stays/{stayId}/checkout (applies 10,000 security deposit + 20,000 final payment -> closes folio)
	chkBody := []byte(`{"paid_by":"guest-99","method":"cash","amount":20000,"reference":"CASH-OUT"}`)
	req = httptest.NewRequest(http.MethodPost, "/stays/stay-99/checkout", bytes.NewReader(chkBody))
	req.Header.Set("Idempotency-Key", "idem-chk-99")
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("POST /stays/stay-99/checkout expected 200, got %d: %s", w.Code, w.Body.String())
	}
	_ = json.Unmarshal(w.Body.Bytes(), &folioResp)
	if folioResp.Status != "closed" || folioResp.Balance != 0 {
		t.Fatalf("expected closed folio with 0 balance, got status=%s balance=%d", folioResp.Status, folioResp.Balance)
	}
}
