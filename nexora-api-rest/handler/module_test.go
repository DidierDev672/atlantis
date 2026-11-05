package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"nexora-api-rest/handler"
	"nexora-api-rest/repository"
	"nexora-api-rest/usecase"
)

func TestModuleHTTP_CreateAndList(t *testing.T) {
	repo := repository.NewInMemoryModuleRepo()
	service := usecase.NewModuleService(repo)
	h := handler.NewModuleHTTP(service)

	mux := http.NewServeMux()
	h.Register(mux)

	t.Run("POST /modules with code and sort_order returns 201", func(t *testing.T) {
		payload := []byte(`{"code": "operation", "sort_order": 1}`)
		req := httptest.NewRequest(http.MethodPost, "/modules", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected status 201 Created, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if res["code"] != "operation" {
			t.Errorf("expected code 'operation', got %v", res["code"])
		}
		if res["sort_order"] != float64(1) {
			t.Errorf("expected sort_order 1, got %v", res["sort_order"])
		}
		if res["id"] == nil || res["id"] == float64(0) {
			t.Errorf("expected auto-generated id > 0, got %v", res["id"])
		}
	})

	t.Run("POST /modules with default sort_order", func(t *testing.T) {
		payload := []byte(`{"code": "billing"}`)
		req := httptest.NewRequest(http.MethodPost, "/modules", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected status 201 Created, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]any
		_ = json.Unmarshal(rec.Body.Bytes(), &res)
		if res["sort_order"] != float64(0) {
			t.Errorf("expected default sort_order 0, got %v", res["sort_order"])
		}
	})

	t.Run("GET /modules returns list of modules", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/modules", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}

		var list []map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &list); err != nil {
			t.Fatalf("failed to decode list: %v", err)
		}
		if len(list) < 2 {
			t.Errorf("expected at least 2 modules, got %d", len(list))
		}
	})

	t.Run("POST /modules with empty code returns 422", func(t *testing.T) {
		payload := []byte(`{"code": "", "sort_order": 1}`)
		req := httptest.NewRequest(http.MethodPost, "/modules", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected status 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

