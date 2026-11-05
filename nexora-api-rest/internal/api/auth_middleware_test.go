package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/infrastructure/auth"
	"nexora-api-rest/internal/infrastructure/persistence/memory"
)

func TestAuthContextMiddleware_RBACAndMultiSede(t *testing.T) {
	roleRepo := memory.NewRoleRepository()
	userRepo := memory.NewUserRepository()
	tokens := auth.NewJWTTokenGenerator("test-secret-key-for-nexora-2026", time.Hour)

	_ = roleRepo.Save(context.Background(), domain.Role{ID: "r-super", Name: domain.RoleSuperAdmin})
	_ = roleRepo.Save(context.Background(), domain.Role{ID: "r-admin", Name: domain.RoleAdmin})
	_ = roleRepo.Save(context.Background(), domain.Role{ID: "r-rec", Name: domain.RoleReception})

	sedeA := domain.HeadquarterID("hq-a")
	sedeB := domain.HeadquarterID("hq-b")

	_ = userRepo.Save(context.Background(), domain.User{
		ID:              "u-super",
		Name:            "Soporte Nexora",
		Email:           "soporte@nexora.com",
		RoleID:          "r-super",
		AllHeadquarters: true,
		Status:          domain.UserStatusActive,
	})
	_ = userRepo.Save(context.Background(), domain.User{
		ID:              "u-admin",
		Name:            "Admin Hotel",
		Email:           "admin@hotel.com",
		RoleID:          "r-admin",
		HeadquartersID:  &sedeA,
		AllHeadquarters: true,
		Status:          domain.UserStatusActive,
	})
	_ = userRepo.Save(context.Background(), domain.User{
		ID:              "u-rec",
		Name:            "Recepcionista Sede A",
		Email:           "recepcion@hotel.com",
		RoleID:          "r-rec",
		HeadquartersID:  &sedeA,
		HeadquartersIDs: []domain.HeadquarterID{sedeA},
		AllHeadquarters: false,
		Status:          domain.UserStatusActive,
	})

	superToken, _ := tokens.GenerateForUser("u-super")
	adminToken, _ := tokens.GenerateForUser("u-admin")
	recToken, _ := tokens.GenerateForUser("u-rec")

	var capturedActor domain.Actor
	handler := authContextMiddleware(tokens, userRepo, roleRepo, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		actor, _ := domain.ActorFromContext(r.Context())
		capturedActor = actor
		w.WriteHeader(http.StatusOK)
	}))

	t.Run("admin cannot create headquarters (commercial restriction)", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/headquarters", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 Forbidden for admin on POST /headquarters, got %d", rec.Code)
		}
	})

	t.Run("super_admin can create headquarters", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/headquarters", nil)
		req.Header.Set("Authorization", "Bearer "+superToken)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for super_admin on POST /headquarters, got %d", rec.Code)
		}
	})

	t.Run("receptionist cannot create users", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/users", nil)
		req.Header.Set("Authorization", "Bearer "+recToken)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 Forbidden for reception on POST /users, got %d", rec.Code)
		}
	})

	t.Run("receptionist assigned to Sede A is blocked from Sede B", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/room", nil)
		req.Header.Set("Authorization", "Bearer "+recToken)
		req.Header.Set("X-Headquarter-ID", string(sedeB))
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 Forbidden when accessing unauthorized headquarter, got %d", rec.Code)
		}
	})

	t.Run("receptionist assigned to Sede A can access Sede A and actor context is populated", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/room", nil)
		req.Header.Set("Authorization", "Bearer "+recToken)
		req.Header.Set("X-Headquarter-ID", string(sedeA))
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for authorized headquarter, got %d", rec.Code)
		}
		if capturedActor.ActiveHeadquarterID != sedeA {
			t.Errorf("expected ActiveHeadquarterID %q, got %q", sedeA, capturedActor.ActiveHeadquarterID)
		}
		if capturedActor.Email != "recepcion@hotel.com" {
			t.Errorf("expected actor email 'recepcion@hotel.com', got %q", capturedActor.Email)
		}
	})
}
