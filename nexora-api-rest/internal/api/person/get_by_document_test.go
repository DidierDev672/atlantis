package person_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	personhttp "nexora-api-rest/internal/api/person"
	"nexora-api-rest/internal/domain"
)

type mockByDocumentGetter struct {
	person domain.Person
	err    error
}

func (m *mockByDocumentGetter) GetByDocument(ctx context.Context, docType domain.DocumentType, docNum string) (domain.Person, error) {
	if m.err != nil {
		return domain.Person{}, m.err
	}
	return m.person, nil
}

func TestPersonHandler_ByDocument(t *testing.T) {
	now := time.Now().UTC()
	expectedPerson := domain.Person{
		ID:             domain.PersonID("p-999"),
		DocumentType:   domain.DocumentTypeNationalID,
		DocumentNumber: "1020304050",
		Name:           "Carlos Santana",
		PhoneNumber:    "+573001234567",
		Email:          "carlos@example.com",
		DateOfBirth:    time.Date(1985, 3, 20, 0, 0, 0, 0, time.UTC),
		Gender:         domain.GenderMale,
		Nationality:    "Colombian",
		Roles:          []domain.RoleID{domain.RoleID("role-guest")},
		CreatedBy:      "admin@hotel.com",
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	t.Run("success", func(t *testing.T) {
		handler := &personhttp.Handler{
			ByDocumentGetter: &mockByDocumentGetter{person: expectedPerson},
		}

		req := httptest.NewRequest(http.MethodGet, "/persons/by-document?document_type=national_id&document_number=1020304050", nil)
		w := httptest.NewRecorder()

		handler.ByDocument(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", resp.StatusCode)
		}

		var resBody map[string]any
		if err := json.NewDecoder(resp.Body).Decode(&resBody); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resBody["id"] != "p-999" {
			t.Errorf("expected id p-999, got %v", resBody["id"])
		}
		if resBody["document_number"] != "1020304050" {
			t.Errorf("expected document_number 1020304050, got %v", resBody["document_number"])
		}
		if resBody["name"] != "Carlos Santana" {
			t.Errorf("expected name Carlos Santana, got %v", resBody["name"])
		}
	})

	t.Run("missing document_type", func(t *testing.T) {
		handler := &personhttp.Handler{
			ByDocumentGetter: &mockByDocumentGetter{person: expectedPerson},
		}

		req := httptest.NewRequest(http.MethodGet, "/persons/by-document?document_number=1020304050", nil)
		w := httptest.NewRecorder()

		handler.ByDocument(w, req)

		if w.Result().StatusCode != http.StatusBadRequest {
			t.Errorf("expected 400 for missing document_type, got %d", w.Result().StatusCode)
		}
	})

	t.Run("invalid document_type", func(t *testing.T) {
		handler := &personhttp.Handler{
			ByDocumentGetter: &mockByDocumentGetter{person: expectedPerson},
		}

		req := httptest.NewRequest(http.MethodGet, "/persons/by-document?document_type=invalid_type&document_number=1020304050", nil)
		w := httptest.NewRecorder()

		handler.ByDocument(w, req)

		if w.Result().StatusCode != http.StatusBadRequest {
			t.Errorf("expected 400 for invalid document_type, got %d", w.Result().StatusCode)
		}
	})

	t.Run("missing document_number", func(t *testing.T) {
		handler := &personhttp.Handler{
			ByDocumentGetter: &mockByDocumentGetter{person: expectedPerson},
		}

		req := httptest.NewRequest(http.MethodGet, "/persons/by-document?document_type=national_id", nil)
		w := httptest.NewRecorder()

		handler.ByDocument(w, req)

		if w.Result().StatusCode != http.StatusBadRequest {
			t.Errorf("expected 400 for missing document_number, got %d", w.Result().StatusCode)
		}
	})

	t.Run("not found", func(t *testing.T) {
		handler := &personhttp.Handler{
			ByDocumentGetter: &mockByDocumentGetter{err: domain.ErrPersonNotFound},
		}

		req := httptest.NewRequest(http.MethodGet, "/persons/by-document?document_type=national_id&document_number=999999", nil)
		w := httptest.NewRecorder()

		handler.ByDocument(w, req)

		if w.Result().StatusCode != http.StatusNotFound {
			t.Errorf("expected 404 for not found, got %d", w.Result().StatusCode)
		}
	})
}
