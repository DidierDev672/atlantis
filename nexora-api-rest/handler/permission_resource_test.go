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

func TestPermissionResourceHTTP_Endpoints(t *testing.T) {
	repo := repository.NewInMemoryPermissionResourceRepo()
	service := usecase.NewPermissionResourceService(repo)
	h := handler.NewPermissionResourceHTTP(service)

	mux := http.NewServeMux()
	h.Register(mux)

	t.Run("POST /permissions with string resource_id returns 201", func(t *testing.T) {
		payload := []byte(`{
			"resource_id": "7",
			"action": "get"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/permissions", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected status 201 Created, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if res["resource_id"] != float64(7) {
			t.Errorf("expected resource_id 7, got %v", res["resource_id"])
		}
		if res["action"] != "get" {
			t.Errorf("expected action 'get', got %v", res["action"])
		}
		if res["id"] == nil || res["id"] == float64(0) {
			t.Errorf("expected auto-generated id > 0, got %v", res["id"])
		}
	})

	t.Run("POST /permissions duplicate (resource_id, action) returns 409 Conflict", func(t *testing.T) {
		payload := []byte(`{
			"resource_id": "7",
			"action": "get"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/permissions", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusConflict {
			t.Fatalf("expected status 409 Conflict for duplicate (resource_id, action), got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /permissions with integer resource_id and description returns 201", func(t *testing.T) {
		payload := []byte(`{
			"resource_id": 7,
			"action": "post",
			"description": "Crear recursos"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/permissions", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected status 201 Created, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]any
		_ = json.Unmarshal(rec.Body.Bytes(), &res)
		if res["action"] != "post" {
			t.Errorf("expected action 'post', got %v", res["action"])
		}
		if res["description"] != "Crear recursos" {
			t.Errorf("expected description 'Crear recursos', got %v", res["description"])
		}
	})

	t.Run("POST /permissions without action returns 422", func(t *testing.T) {
		payload := []byte(`{
			"resource_id": "7"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/permissions", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected status 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /permissions without resource_id returns 422", func(t *testing.T) {
		payload := []byte(`{
			"action": "delete"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/permissions", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected status 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("GET /permissions returns list", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/permissions", nil)
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
			t.Fatalf("expected at least 2 permissions, got %d", len(list))
		}
	})

	t.Run("GET /permissions/1 returns single permission", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/permissions/1", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("DELETE /permissions/1 returns 204", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/permissions/1", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected status 204 No Content, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("Backward compatibility: GET /permission-resource", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/permission-resource", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

