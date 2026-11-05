package rolelimit_test

import (
	"context"
	"errors"
	"testing"

	"nexora-api-rest/internal/rolelimit"
)

type fakeRepo struct {
	store map[string]rolelimit.RoleLimit
}

func newFakeRepo() *fakeRepo {
	return &fakeRepo{store: make(map[string]rolelimit.RoleLimit)}
}

func (f *fakeRepo) makeKey(roleID, limitKey string) string {
	return roleID + ":" + limitKey
}

func (f *fakeRepo) EnsureTable(ctx context.Context) error {
	return nil
}

func (f *fakeRepo) Create(ctx context.Context, limit rolelimit.RoleLimit) error {
	k := f.makeKey(limit.RoleID, limit.LimitKey)
	if _, exists := f.store[k]; exists {
		return rolelimit.ErrDuplicateKey
	}
	f.store[k] = limit
	return nil
}

func (f *fakeRepo) Get(ctx context.Context, roleID, limitKey string) (rolelimit.RoleLimit, error) {
	k := f.makeKey(roleID, limitKey)
	item, ok := f.store[k]
	if !ok {
		return rolelimit.RoleLimit{}, rolelimit.ErrNotFound
	}
	return item, nil
}

func (f *fakeRepo) ListByRole(ctx context.Context, roleID string) ([]rolelimit.RoleLimit, error) {
	var result []rolelimit.RoleLimit
	for _, item := range f.store {
		if item.RoleID == roleID {
			result = append(result, item)
		}
	}
	return result, nil
}

func (f *fakeRepo) ListAll(ctx context.Context) ([]rolelimit.RoleLimit, error) {
	var result []rolelimit.RoleLimit
	for _, item := range f.store {
		result = append(result, item)
	}
	return result, nil
}

func (f *fakeRepo) Update(ctx context.Context, limit rolelimit.RoleLimit) error {
	k := f.makeKey(limit.RoleID, limit.LimitKey)
	if _, exists := f.store[k]; !exists {
		return rolelimit.ErrNotFound
	}
	f.store[k] = limit
	return nil
}

func (f *fakeRepo) Delete(ctx context.Context, roleID, limitKey string) error {
	k := f.makeKey(roleID, limitKey)
	if _, exists := f.store[k]; !exists {
		return rolelimit.ErrNotFound
	}
	delete(f.store, k)
	return nil
}

func TestUseCase_CreateAndGet(t *testing.T) {
	repo := newFakeRepo()
	uc := rolelimit.NewUseCase(repo, nil)
	ctx := context.Background()

	t.Run("successful creation and retrieval", func(t *testing.T) {
		created, err := uc.Create(ctx, rolelimit.CreateInput{
			RoleID:   "role-admin",
			LimitKey: "sedes",
			MaxValue: 5,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if created.ID == "" {
			t.Errorf("expected generated ID")
		}

		got, err := uc.Get(ctx, "role-admin", "sedes")
		if err != nil {
			t.Fatalf("failed to get: %v", err)
		}
		if got.MaxValue != 5 {
			t.Errorf("expected 5, got %d", got.MaxValue)
		}
	})

	t.Run("duplicate creation returns ErrDuplicateKey", func(t *testing.T) {
		_, err := uc.Create(ctx, rolelimit.CreateInput{
			RoleID:   "role-admin",
			LimitKey: "sedes",
			MaxValue: 10,
		})
		if !errors.Is(err, rolelimit.ErrDuplicateKey) {
			t.Fatalf("expected ErrDuplicateKey, got %v", err)
		}
	})

	t.Run("update limit value", func(t *testing.T) {
		updated, err := uc.Update(ctx, rolelimit.UpdateInput{
			RoleID:   "role-admin",
			LimitKey: "sedes",
			MaxValue: 20,
		})
		if err != nil {
			t.Fatalf("update failed: %v", err)
		}
		if updated.MaxValue != 20 {
			t.Errorf("expected 20, got %d", updated.MaxValue)
		}
	})

	t.Run("delete limit", func(t *testing.T) {
		err := uc.Delete(ctx, "role-admin", "sedes")
		if err != nil {
			t.Fatalf("delete failed: %v", err)
		}
		_, err = uc.Get(ctx, "role-admin", "sedes")
		if !errors.Is(err, rolelimit.ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

