package auth_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	authhttp "nexora-api-rest/internal/api/auth"
	authapp "nexora-api-rest/internal/application/auth"
)

type mockAuthenticator struct {
	token string
	err   error
}

func (m *mockAuthenticator) Authenticate(ctx context.Context, in authapp.AuthenticateInput) (string, error) {
	return m.token, m.err
}

func TestHandler_Login(t *testing.T) {
	t.Run("returns 200 with token on successful login", func(t *testing.T) {
		h := &authhttp.Handler{
			Authenticator: &mockAuthenticator{token: "signed-jwt-token"},
		}

		payload := []byte(`{"email":"ariasdev672@gmail.com","password":"$DemonSlayer45@"}`)
		req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		h.Login(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}

		var res map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if res["token"] != "signed-jwt-token" {
			t.Errorf("expected token 'signed-jwt-token', got %q", res["token"])
		}
	})

	t.Run("returns 401 on invalid credentials", func(t *testing.T) {
		h := &authhttp.Handler{
			Authenticator: &mockAuthenticator{err: authapp.ErrInvalidCredentials},
		}

		payload := []byte(`{"email":"ariasdev672@gmail.com","password":"wrong"}`)
		req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		h.Login(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected status 401, got %d", rec.Code)
		}

		var res map[string]string
		_ = json.Unmarshal(rec.Body.Bytes(), &res)
		if res["error"] != "invalid credentials" {
			t.Errorf("expected 'invalid credentials', got %q", res["error"])
		}
	})

	t.Run("returns 400 when missing email or password", func(t *testing.T) {
		h := &authhttp.Handler{
			Authenticator: &mockAuthenticator{},
		}

		payload := []byte(`{"email":"","password":""}`)
		req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewReader(payload))
		rec := httptest.NewRecorder()

		h.Login(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", rec.Code)
		}
	})
}

