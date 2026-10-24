package guestattendant_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"nexora-api-rest/internal/guestattendant"
)

type mockService struct {
	createFn func(ctx context.Context, in guestattendant.CreateInput) (guestattendant.GuestAttendant, error)
	getFn    func(ctx context.Context, id guestattendant.ID) (guestattendant.GuestAttendant, error)
	listFn   func(ctx context.Context, filter guestattendant.ListFilter) ([]guestattendant.GuestAttendant, error)
	updateFn func(ctx context.Context, in guestattendant.UpdateInput) (guestattendant.GuestAttendant, error)
	deleteFn func(ctx context.Context, id guestattendant.ID) error
}

func (m *mockService) Create(ctx context.Context, in guestattendant.CreateInput) (guestattendant.GuestAttendant, error) {
	if m.createFn != nil {
		return m.createFn(ctx, in)
	}
	return guestattendant.GuestAttendant{}, nil
}

func (m *mockService) GetByID(ctx context.Context, id guestattendant.ID) (guestattendant.GuestAttendant, error) {
	if m.getFn != nil {
		return m.getFn(ctx, id)
	}
	return guestattendant.GuestAttendant{}, nil
}

func (m *mockService) List(ctx context.Context, filter guestattendant.ListFilter) ([]guestattendant.GuestAttendant, error) {
	if m.listFn != nil {
		return m.listFn(ctx, filter)
	}
	return nil, nil
}

func (m *mockService) Update(ctx context.Context, in guestattendant.UpdateInput) (guestattendant.GuestAttendant, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, in)
	}
	return guestattendant.GuestAttendant{}, nil
}

func (m *mockService) Delete(ctx context.Context, id guestattendant.ID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	return nil
}

func TestHandler_HTTPFlow(t *testing.T) {
	now := time.Now().UTC()
	svc := &mockService{
		createFn: func(ctx context.Context, in guestattendant.CreateInput) (guestattendant.GuestAttendant, error) {
			return guestattendant.GuestAttendant{
				ID:        "att-99",
				StayID:    guestattendant.StayID(in.StayID),
				PersonIDs: []guestattendant.PersonID{"p-1"},
				CreatedAt: now,
				UpdatedAt: now,
			}, nil
		},
		getFn: func(ctx context.Context, id guestattendant.ID) (guestattendant.GuestAttendant, error) {
			if id == "not-found" {
				return guestattendant.GuestAttendant{}, guestattendant.ErrNotFound
			}
			return guestattendant.GuestAttendant{
				ID:        id,
				StayID:    "stay-1",
				PersonIDs: []guestattendant.PersonID{"p-1"},
				CreatedAt: now,
				UpdatedAt: now,
			}, nil
		},
	}

	mux := http.NewServeMux()
	handler := guestattendant.NewHandler(svc)
	handler.Register(mux)

	// Test POST /guest-attendant
	body, _ := json.Marshal(map[string]any{
		"id_stay":   "stay-1",
		"person_id": []string{"p-1"},
	})
	req := httptest.NewRequest(http.MethodPost, "/guest-attendant", bytes.NewReader(body))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	// Test GET /guest-attendant/att-99
	reqGet := httptest.NewRequest(http.MethodGet, "/guest-attendant/att-99", nil)
	recGet := httptest.NewRecorder()
	mux.ServeHTTP(recGet, reqGet)

	if recGet.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", recGet.Code, recGet.Body.String())
	}

	// Test GET /guest-attendant/not-found -> 404
	req404 := httptest.NewRequest(http.MethodGet, "/guest-attendant/not-found", nil)
	rec404 := httptest.NewRecorder()
	mux.ServeHTTP(rec404, req404)

	if rec404.Code != http.StatusNotFound {
		t.Fatalf("expected 404 Not Found, got %d. Body: %s", rec404.Code, rec404.Body.String())
	}
}
