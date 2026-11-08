package rolelimit_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"nexora-api-rest/internal/rolelimit"
)

func TestHandler_Endpoints(t *testing.T) {
	repo := newFakeRepo()
	uc := rolelimit.NewUseCase(repo, nil)
	h := rolelimit.NewHandler(uc)

	mux := http.NewServeMux()
	h.Register(mux)

	t.Run("POST /role_limits creates role limit returning 201", func(t *testing.T) {
		payload := []byte(`{
			"role_id": "910dc925870dc286",
			"limit_key": "sedes",
			"max_value": 3
		}`)
		req := httptest.NewRequest(http.MethodPost, "/role_limits", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if res["role_id"] != "910dc925870dc286" {
			t.Errorf("expected role_id '910dc925870dc286', got %v", res["role_id"])
		}
		if res["limit_key"] != "sedes" {
			t.Errorf("expected limit_key 'sedes', got %v", res["limit_key"])
		}
		if res["max_value"] != float64(3) {
			t.Errorf("expected max_value 3, got %v", res["max_value"])
		}
	})

	t.Run("POST /role_limits duplicate returns 409 Conflict", func(t *testing.T) {
		payload := []byte(`{
			"role_id": "910dc925870dc286",
			"limit_key": "sedes",
			"max_value": 5
		}`)
		req := httptest.NewRequest(http.MethodPost, "/role_limits", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409 Conflict, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /role_limits with invalid limit_key returns 422 Unprocessable Entity", func(t *testing.T) {
		payload := []byte(`{
			"role_id": "910dc925870dc286",
			"limit_key": "Sedes Invalid!",
			"max_value": 2
		}`)
		req := httptest.NewRequest(http.MethodPost, "/role_limits", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /role_limits with negative max_value returns 422", func(t *testing.T) {
		payload := []byte(`{
			"role_id": "910dc925870dc286",
			"limit_key": "sub_sedes",
			"max_value": -5
		}`)
		req := httptest.NewRequest(http.MethodPost, "/role_limits", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("GET /role_limits returns all items", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/role_limits", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
		var list []map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &list); err != nil {
			t.Fatalf("decode err: %v", err)
		}
		if len(list) != 1 {
			t.Errorf("expected 1 item, got %d", len(list))
		}
	})

	t.Run("GET /role_limits/{role_id}/{limit_key} returns single item", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/role_limits/910dc925870dc286/sedes", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("PUT /role_limits/{role_id}/{limit_key} updates max_value", func(t *testing.T) {
		payload := []byte(`{"max_value": 8}`)
		req := httptest.NewRequest(http.MethodPut, "/role_limits/910dc925870dc286/sedes", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]any
		_ = json.Unmarshal(rec.Body.Bytes(), &res)
		if res["max_value"] != float64(8) {
			t.Errorf("expected 8, got %v", res["max_value"])
		}
	})

	t.Run("DELETE /role_limits/{role_id}/{limit_key} deletes item returning 204", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/role_limits/910dc925870dc286/sedes", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204 No Content, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

