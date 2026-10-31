package password_test

import (
	"testing"

	"nexora-api-rest/internal/infrastructure/password"
)

func TestBcryptHasher_DemonSlayer(t *testing.T) {
	hasher := password.BcryptHasher{}
	rawPassword := "$DemonSlayer45@"

	hash, err := hasher.Hash(rawPassword)
	if err != nil {
		t.Fatalf("unexpected error hashing: %v", err)
	}
	t.Logf("Generated bcrypt hash for %s: %s", rawPassword, hash)

	if err := hasher.Compare(rawPassword, hash); err != nil {
		t.Fatalf("expected password to match, got: %v", err)
	}

	// Compare with wrong password
	if err := hasher.Compare("wrongPassword", hash); err == nil {
		t.Fatal("expected error for wrong password, got nil")
	}

	// Compare with plain text as hash (to demonstrate why plain text fails)
	if err := hasher.Compare(rawPassword, rawPassword); err == nil {
		t.Fatal("expected error when comparing against plain text as hash")
	} else {
		t.Logf("Comparing against plain text fails as expected with: %v", err)
	}
}

