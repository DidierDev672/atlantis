package servicerequest_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"nexora-api-rest/internal/servicerequest"
)

func setupSRMux() (*http.ServeMux, *mockSRRepo) {
	repo := newMockSRRepo()
	fixedNow := time.Date(2026, 10, 3, 14, 0, 0, 0, time.UTC)
	idGen := &fixedIDGen{}
	clock := fixedClock{now: fixedNow}

	uc := servicerequest.NewUseCase(repo, idGen, clock)
	h := servicerequest.NewHandler(uc)

	mux := http.NewServeMux()
	h.Register(mux)
	return mux, repo
}

func TestHandler_HTTPFlow(t *testing.T) {
	mux, _ := setupSRMux()

	// 1. Test POST /service-request
	body := []byte(`{
		"order_number": "ORD-2026-888",
		"stay_id": "stay-44",
		"person_id": "guest-11",
		"channel": "room_tablet",
		"general_notes": "Dejar cubiertos extra",
		"delivery_instructions": "Tocar timbre suavemente",
		"currency": "USD",
		"items": [
			{
				"item_menu_id": "item-pasta",
				"name_snapshot": "Fettuccine Alfredo",
				"price_unit": 18.0,
				"tax_rate": 10.0,
				"amount": 1,
				"note": "Poco queso"
			}
		],
		"created_by": "guest_app"
	}`)

	req := httptest.NewRequest(http.MethodPost, "/service-request", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d. Body: %s", w.Code, w.Body.String())
	}

	var created servicerequest.Response
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if created.ID != "sr-id-1" {
		t.Errorf("expected ID 'sr-id-1', got %s", created.ID)
	}
	if created.OrderNumber != "ORD-2026-888" {
		t.Errorf("expected OrderNumber 'ORD-2026-888', got %s", created.OrderNumber)
	}
	if created.Total != 19.8 { // 18 + 1.8
		t.Errorf("expected Total 19.8, got %f", created.Total)
	}
	if len(created.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(created.Items))
	}

	// 2. Test GET /service-request
	reqList := httptest.NewRequest(http.MethodGet, "/service-request", nil)
	wList := httptest.NewRecorder()
	mux.ServeHTTP(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", wList.Code)
	}

	var list []servicerequest.Response
	if err := json.Unmarshal(wList.Body.Bytes(), &list); err != nil {
		t.Fatalf("failed to decode list response: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 result, got %d", len(list))
	}

	// 3. Test GET /service-request/{id}
	reqGet := httptest.NewRequest(http.MethodGet, "/service-request/sr-id-1", nil)
	wGet := httptest.NewRecorder()
	mux.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", wGet.Code)
	}

	// 4. Test PUT /service-request/{id}
	updateBody := []byte(`{
		"status": "confirmed",
		"actor_type": "staff",
		"actor_id": "waiter-9",
		"status_comment": "En cocina"
	}`)
	reqUpdate := httptest.NewRequest(http.MethodPut, "/service-request/sr-id-1", bytes.NewReader(updateBody))
	reqUpdate.Header.Set("Content-Type", "application/json")
	wUpdate := httptest.NewRecorder()
	mux.ServeHTTP(wUpdate, reqUpdate)

	if wUpdate.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d. Body: %s", wUpdate.Code, wUpdate.Body.String())
	}

	var updated servicerequest.Response
	if err := json.Unmarshal(wUpdate.Body.Bytes(), &updated); err != nil {
		t.Fatalf("failed to decode update response: %v", err)
	}
	if updated.Status != "confirmed" {
		t.Errorf("expected Status 'confirmed', got %s", updated.Status)
	}

	// 5. Test DELETE /service-request/{id}
	reqDel := httptest.NewRequest(http.MethodDelete, "/service-request/sr-id-1", nil)
	wDel := httptest.NewRecorder()
	mux.ServeHTTP(wDel, reqDel)

	if wDel.Code != http.StatusNoContent {
		t.Fatalf("expected status 204 No Content, got %d", wDel.Code)
	}

	// 6. Test POST /service-request with full client payload (including id, status, subtotal, taxes, total, history, timestamps)
	fullPayload := []byte(`{
		"id": "fd27c802-dc6c-48e0-a78d-28ef3127b8a7",
		"order_number": "84",
		"stay_id": "d1e6cda9602627bb",
		"person_id": "68ef93ef5af065f3",
		"status": "pending",
		"channel": "room_tablet",
		"general_notes": "",
		"delivery_instructions": "",
		"scheduled_for": "2026-11-15T11:43:00.000Z",
		"currency": "COP",
		"subtotal": 43000,
		"taxes": 4300,
		"total": 47300,
		"created_by": "fredyarias1972@gmail.com",
		"items": [
			{
				"id": "80198df0-d929-434e-88f3-cb53026f0341",
				"order_id": "fd27c802-dc6c-48e0-a78d-28ef3127b8a7",
				"item_menu_id": "c2f8abbc59ad7f1a",
				"name_snapshot": "Latte de Vainilla",
				"price_unit": 8500,
				"tax_rate": 10,
				"amount": 1,
				"note": "",
				"created_by": "fredyarias1972@gmail.com",
				"created_at": "2026-11-15T11:25:39.945Z",
				"updated_at": "2026-11-15T11:25:39.945Z"
			}
		],
		"history": [
			{
				"id": "9d10ef1f-53bb-423b-bd30-9961d244d0f7",
				"order_id": "fd27c802-dc6c-48e0-a78d-28ef3127b8a7",
				"previous_state": "",
				"status_new": "pending",
				"actor_type": "guest",
				"actor_id": "68ef93ef5af065f3",
				"comment": "Order created",
				"created_by": "fredyarias1972@gmail.com",
				"created_at": "2026-11-15T11:25:39.945Z",
				"updated_at": "2026-11-15T11:25:39.945Z"
			}
		],
		"created_at": "2026-11-15T11:25:39.945Z",
		"updated_at": "2026-11-15T11:25:39.945Z"
	}`)
	reqFull := httptest.NewRequest(http.MethodPost, "/service-request", bytes.NewReader(fullPayload))
	reqFull.Header.Set("Content-Type", "application/json")
	wFull := httptest.NewRecorder()
	mux.ServeHTTP(wFull, reqFull)

	if wFull.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created for full payload, got %d. Body: %s", wFull.Code, wFull.Body.String())
	}
}
