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

func TestResourceHTTP_CreateAndList(t *testing.T) {
	repo := repository.NewInMemoryResourceRepo()
	service := usecase.NewResourceService(repo)
	h := handler.NewResourceHTTP(service)

	mux := http.NewServeMux()
	h.Register(mux)

	t.Run("POST /resources with string module_id returns 201", func(t *testing.T) {
		payload := []byte(`{
			"module_id": "29",
			"code": "operation",
			"name": "Operaciónes",
			"sort_order": 2,
			"show_in_menu": true
		}`)
		req := httptest.NewRequest(http.MethodPost, "/resources", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected status 201 Created, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if res["module_id"] != float64(29) {
			t.Errorf("expected module_id 29, got %v", res["module_id"])
		}
		if res["code"] != "operation" {
			t.Errorf("expected code 'operation', got %v", res["code"])
		}
		if res["name"] != "Operaciónes" {
			t.Errorf("expected name 'Operaciónes', got %v", res["name"])
		}
		if res["sort_order"] != float64(2) {
			t.Errorf("expected sort_order 2, got %v", res["sort_order"])
		}
		if res["show_in_menu"] != true {
			t.Errorf("expected show_in_menu true, got %v", res["show_in_menu"])
		}
		if res["id"] == nil || res["id"] == float64(0) {
			t.Errorf("expected auto-generated id > 0, got %v", res["id"])
		}
	})

	t.Run("POST /resources with integer module_id returns 201", func(t *testing.T) {
		payload := []byte(`{
			"module_id": 29,
			"code": "billing",
			"name": "Facturación"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/resources", bytes.NewReader(payload))
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
		if res["show_in_menu"] != true {
			t.Errorf("expected default show_in_menu true, got %v", res["show_in_menu"])
		}
	})

	t.Run("GET /resources returns list", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/resources", nil)
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
			t.Errorf("expected at least 2 resources, got %d", len(list))
		}
	})

	t.Run("POST /resources with missing module_id returns 422", func(t *testing.T) {
		payload := []byte(`{
			"code": "test",
			"name": "Test"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/resources", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected status 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

