package userlimit_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"nexora-api-rest/internal/userlimit"
)

func TestHandler_Endpoints(t *testing.T) {
	repo := newFakeUserLimitRepo()
	uc := userlimit.NewUseCase(repo, nil)
	h := userlimit.NewHandler(uc)

	mux := http.NewServeMux()
	h.Register(mux)

	t.Run("POST /user_limits creates user limit returning 201", func(t *testing.T) {
		payload := []byte(`{
			"user_id": "usr-uuid-99",
			"limit_key": "sedes",
			"max_value": 3
		}`)
		req := httptest.NewRequest(http.MethodPost, "/user_limits", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", rec.Code, rec.Body.String())
		}

		var res map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if res["user_id"] != "usr-uuid-99" {
			t.Errorf("expected user_id 'usr-uuid-99', got %v", res["user_id"])
		}
		if res["limit_key"] != "sedes" {
			t.Errorf("expected limit_key 'sedes', got %v", res["limit_key"])
		}
		if res["max_value"] != float64(3) {
			t.Errorf("expected max_value 3, got %v", res["max_value"])
		}
	})

	t.Run("POST /user_limits duplicate returns 409 Conflict", func(t *testing.T) {
		payload := []byte(`{
			"user_id": "usr-uuid-99",
			"limit_key": "sedes",
			"max_value": 5
		}`)
		req := httptest.NewRequest(http.MethodPost, "/user_limits", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusConflict {
			t.Fatalf("expected 409 Conflict, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /user_limits with invalid limit_key returns 422 Unprocessable Entity", func(t *testing.T) {
		payload := []byte(`{
			"user_id": "usr-uuid-99",
			"limit_key": "Sedes Invalid!",
			"max_value": 2
		}`)
		req := httptest.NewRequest(http.MethodPost, "/user_limits", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /user_limits with negative max_value returns 422", func(t *testing.T) {
		payload := []byte(`{
			"user_id": "usr-uuid-99",
			"limit_key": "sub_sedes",
			"max_value": -5
		}`)
		req := httptest.NewRequest(http.MethodPost, "/user_limits", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422 Unprocessable Entity, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("GET /user_limits returns all items", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/user_limits", nil)
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

	t.Run("GET /user_limits/{user_id}/{limit_key} returns single item", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/user_limits/usr-uuid-99/sedes", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("PUT /user_limits/{user_id}/{limit_key} updates max_value", func(t *testing.T) {
		payload := []byte(`{"max_value": 8}`)
		req := httptest.NewRequest(http.MethodPut, "/user_limits/usr-uuid-99/sedes", bytes.NewReader(payload))
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

	t.Run("DELETE /user_limits/{user_id}/{limit_key} deletes item returning 204", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/user_limits/usr-uuid-99/sedes", nil)
		rec := httptest.NewRecorder()

		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204 No Content, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

