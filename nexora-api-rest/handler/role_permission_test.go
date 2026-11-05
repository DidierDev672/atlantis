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

func TestRolePermissionHTTP_Endpoints(t *testing.T) {
	repo := repository.NewInMemoryRolePermissionRepo()
	service := usecase.NewRolePermissionService(repo)
	h := handler.NewRolePermissionHTTP(service)

	mux := http.NewServeMux()
	h.Register(mux)

	t.Run("POST /role-permissions with valid role_id and permission_id returns 201", func(t *testing.T) {
		payload := []byte(`{
			"role_id": "910dc925870dc286",
			"permission_id": "7"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/role-permissions", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected status 201 Created, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if res["role_id"] != "910dc925870dc286" {
			t.Errorf("expected role_id '910dc925870dc286', got %v", res["role_id"])
		}
		if res["permission_id"] != "7" {
			t.Errorf("expected permission_id '7', got %v", res["permission_id"])
		}
		if res["id"] == nil || res["id"] == "" {
			t.Errorf("expected generated UUID id, got %v", res["id"])
		}
	})

	t.Run("POST /role-permissions with only role_id returns 422 Unprocessable Entity", func(t *testing.T) {
		payload := []byte(`{
			"role_id": "910dc925870dc286"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/role-permissions", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected status 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]string
		_ = json.Unmarshal(rec.Body.Bytes(), &res)
		if res["error"] != "el campo 'permission_id' es requerido" {
			t.Errorf("expected error message 'el campo \\'permission_id\\' es requerido', got %q", res["error"])
		}
	})

	t.Run("POST /role-permissions without role_id returns 422 Unprocessable Entity", func(t *testing.T) {
		payload := []byte(`{
			"permission_id": "7"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/role-permissions", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected status 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /role-permissions duplicate PRIMARY KEY (role_id, permission_id) returns 409 Conflict", func(t *testing.T) {
		payload := []byte(`{
			"role_id": "910dc925870dc286",
			"permission_id": "7"
		}`)
		req := httptest.NewRequest(http.MethodPost, "/role-permissions", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusConflict {
			t.Fatalf("expected status 409 Conflict, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("GET /role-permissions returns all assignments", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/role-permissions", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}

		var list []map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &list); err != nil {
			t.Fatalf("failed to decode json: %v", err)
		}
		if len(list) != 1 {
			t.Fatalf("expected 1 assignment, got %d", len(list))
		}
	})

	t.Run("GET /role-permissions?role_id=910dc925870dc286 filters by role", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/role-permissions?role_id=910dc925870dc286", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}

		var list []map[string]any
		_ = json.Unmarshal(rec.Body.Bytes(), &list)
		if len(list) != 1 {
			t.Fatalf("expected 1 assignment, got %d", len(list))
		}
	})

	t.Run("GET /role-permissions/910dc925870dc286 returns permissions by path", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/role-permissions/910dc925870dc286", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("DELETE /role-permissions/910dc925870dc286/7 revokes assignment returning 204", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/role-permissions/910dc925870dc286/7", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected status 204 No Content, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("DELETE /role-permissions/910dc925870dc286/7 not found returns 404", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/role-permissions/910dc925870dc286/7", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected status 404 Not Found, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

