package userlimit_test

import (
	"context"
	"errors"
	"testing"

	"nexora-api-rest/internal/userlimit"
)

type fakeUserLimitRepo struct {
	store map[string]userlimit.UserLimit
}

func newFakeUserLimitRepo() *fakeUserLimitRepo {
	return &fakeUserLimitRepo{store: make(map[string]userlimit.UserLimit)}
}

func (f *fakeUserLimitRepo) makeKey(userID, limitKey string) string {
	return userID + ":" + limitKey
}

func (f *fakeUserLimitRepo) EnsureTable(ctx context.Context) error {
	return nil
}

func (f *fakeUserLimitRepo) Create(ctx context.Context, limit userlimit.UserLimit) error {
	k := f.makeKey(limit.UserID, limit.LimitKey)
	if _, exists := f.store[k]; exists {
		return userlimit.ErrDuplicateKey
	}
	f.store[k] = limit
	return nil
}

func (f *fakeUserLimitRepo) Get(ctx context.Context, userID, limitKey string) (userlimit.UserLimit, error) {
	k := f.makeKey(userID, limitKey)
	item, ok := f.store[k]
	if !ok {
		return userlimit.UserLimit{}, userlimit.ErrNotFound
	}
	return item, nil
}

func (f *fakeUserLimitRepo) ListByUser(ctx context.Context, userID string) ([]userlimit.UserLimit, error) {
	var result []userlimit.UserLimit
	for _, item := range f.store {
		if item.UserID == userID {
			result = append(result, item)
		}
	}
	return result, nil
}

func (f *fakeUserLimitRepo) ListAll(ctx context.Context) ([]userlimit.UserLimit, error) {
	var result []userlimit.UserLimit
	for _, item := range f.store {
		result = append(result, item)
	}
	return result, nil
}

func (f *fakeUserLimitRepo) Update(ctx context.Context, limit userlimit.UserLimit) error {
	k := f.makeKey(limit.UserID, limit.LimitKey)
	if _, exists := f.store[k]; !exists {
		return userlimit.ErrNotFound
	}
	f.store[k] = limit
	return nil
}

func (f *fakeUserLimitRepo) Delete(ctx context.Context, userID, limitKey string) error {
	k := f.makeKey(userID, limitKey)
	if _, exists := f.store[k]; !exists {
		return userlimit.ErrNotFound
	}
	delete(f.store, k)
	return nil
}

func TestUseCase_CreateAndGet(t *testing.T) {
	repo := newFakeUserLimitRepo()
	uc := userlimit.NewUseCase(repo, nil)
	ctx := context.Background()

	t.Run("successful creation and retrieval", func(t *testing.T) {
		created, err := uc.Create(ctx, userlimit.CreateInput{
			UserID:   "usr-uuid-1",
			LimitKey: "sedes",
			MaxValue: 5,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if created.ID == "" {
			t.Errorf("expected generated ID")
		}

		got, err := uc.Get(ctx, "usr-uuid-1", "sedes")
		if err != nil {
			t.Fatalf("failed to get: %v", err)
		}
		if got.MaxValue != 5 {
			t.Errorf("expected 5, got %d", got.MaxValue)
		}
	})

	t.Run("duplicate creation returns ErrDuplicateKey", func(t *testing.T) {
		_, err := uc.Create(ctx, userlimit.CreateInput{
			UserID:   "usr-uuid-1",
			LimitKey: "sedes",
			MaxValue: 10,
		})
		if !errors.Is(err, userlimit.ErrDuplicateKey) {
			t.Fatalf("expected ErrDuplicateKey, got %v", err)
		}
	})

	t.Run("update limit value", func(t *testing.T) {
		updated, err := uc.Update(ctx, userlimit.UpdateInput{
			UserID:   "usr-uuid-1",
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
		err := uc.Delete(ctx, "usr-uuid-1", "sedes")
		if err != nil {
			t.Fatalf("delete failed: %v", err)
		}
		_, err = uc.Get(ctx, "usr-uuid-1", "sedes")
		if !errors.Is(err, userlimit.ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

