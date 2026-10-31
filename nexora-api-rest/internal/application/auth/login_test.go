package auth_test

import (
	"context"
	"errors"
	"testing"

	authapp "nexora-api-rest/internal/application/auth"
	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/infrastructure/password"
)

type mockUserRepo struct {
	user domain.User
	err  error
}

func (m *mockUserRepo) FindAll(ctx context.Context) ([]domain.User, error) {
	return nil, nil
}
func (m *mockUserRepo) FindByID(ctx context.Context, id domain.UserID) (domain.User, error) {
	return m.user, m.err
}
func (m *mockUserRepo) FindByEmail(ctx context.Context, email string) (domain.User, error) {
	if m.err != nil {
		return domain.User{}, m.err
	}
	return m.user, nil
}
func (m *mockUserRepo) Save(ctx context.Context, user domain.User) error   { return nil }
func (m *mockUserRepo) Update(ctx context.Context, user domain.User) error { return nil }
func (m *mockUserRepo) Delete(ctx context.Context, id domain.UserID) error { return nil }

type mockTokenGenerator struct {
	token string
	err   error
}

func (m *mockTokenGenerator) GenerateForUser(id domain.UserID) (string, error) {
	return m.token, m.err
}

func TestAuthenticateUseCase(t *testing.T) {
	hasher := password.BcryptHasher{}
	rawPassword := "$DemonSlayer45@"
	validHash, _ := hasher.Hash(rawPassword)

	t.Run("success with valid credentials", func(t *testing.T) {
		repo := &mockUserRepo{
			user: domain.User{
				ID:           "user-123",
				Email:        "ariasdev672@gmail.com",
				PasswordHash: validHash,
				Status:       domain.UserStatusActive,
			},
		}
		tokens := &mockTokenGenerator{token: "mock-jwt-token"}
		uc := authapp.NewAuthenticateUseCase(repo, hasher, tokens, password.DummyHash)

		token, err := uc.Authenticate(context.Background(), authapp.AuthenticateInput{
			Email:    "ariasdev672@gmail.com",
			Password: rawPassword,
		})
		if err != nil {
			t.Fatalf("expected success, got error: %v", err)
		}
		if token != "mock-jwt-token" {
			t.Errorf("expected token 'mock-jwt-token', got %s", token)
		}
	})

	t.Run("fails when user does not exist", func(t *testing.T) {
		repo := &mockUserRepo{err: domain.ErrUserNotFound}
		tokens := &mockTokenGenerator{}
		uc := authapp.NewAuthenticateUseCase(repo, hasher, tokens, password.DummyHash)

		_, err := uc.Authenticate(context.Background(), authapp.AuthenticateInput{
			Email:    "nonexistent@gmail.com",
			Password: rawPassword,
		})
		if !errors.Is(err, authapp.ErrInvalidCredentials) {
			t.Fatalf("expected ErrInvalidCredentials, got %v", err)
		}
	})

	t.Run("fails when user status is inactive", func(t *testing.T) {
		repo := &mockUserRepo{
			user: domain.User{
				ID:           "user-123",
				Email:        "ariasdev672@gmail.com",
				PasswordHash: validHash,
				Status:       domain.UserStatusInactive,
			},
		}
		tokens := &mockTokenGenerator{}
		uc := authapp.NewAuthenticateUseCase(repo, hasher, tokens, password.DummyHash)

		_, err := uc.Authenticate(context.Background(), authapp.AuthenticateInput{
			Email:    "ariasdev672@gmail.com",
			Password: rawPassword,
		})
		if !errors.Is(err, authapp.ErrInvalidCredentials) {
			t.Fatalf("expected ErrInvalidCredentials, got %v", err)
		}
	})

	t.Run("fails when password does not match", func(t *testing.T) {
		repo := &mockUserRepo{
			user: domain.User{
				ID:           "user-123",
				Email:        "ariasdev672@gmail.com",
				PasswordHash: validHash,
				Status:       domain.UserStatusActive,
			},
		}
		tokens := &mockTokenGenerator{}
		uc := authapp.NewAuthenticateUseCase(repo, hasher, tokens, password.DummyHash)

		_, err := uc.Authenticate(context.Background(), authapp.AuthenticateInput{
			Email:    "ariasdev672@gmail.com",
			Password: "WrongPassword123!",
		})
		if !errors.Is(err, authapp.ErrInvalidCredentials) {
			t.Fatalf("expected ErrInvalidCredentials, got %v", err)
		}
	})

	t.Run("fails when password in DB is plain text (not a bcrypt hash)", func(t *testing.T) {
		// Simulating when someone saved "$DemonSlayer45@" directly into the DB column
		repo := &mockUserRepo{
			user: domain.User{
				ID:           "user-123",
				Email:        "ariasdev672@gmail.com",
				PasswordHash: "$DemonSlayer45@", // plain text instead of bcrypt hash
				Status:       domain.UserStatusActive,
			},
		}
		tokens := &mockTokenGenerator{}
		uc := authapp.NewAuthenticateUseCase(repo, hasher, tokens, password.DummyHash)

		_, err := uc.Authenticate(context.Background(), authapp.AuthenticateInput{
			Email:    "ariasdev672@gmail.com",
			Password: "$DemonSlayer45@",
		})
		if !errors.Is(err, authapp.ErrInvalidCredentials) {
			t.Fatalf("expected ErrInvalidCredentials when DB contains plain text, got %v", err)
		}
	})
}

