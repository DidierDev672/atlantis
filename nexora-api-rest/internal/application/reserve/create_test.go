package reserve_test

import (
	"context"
	"testing"
	"time"

	reserveapp "nexora-api-rest/internal/application/reserve"
	"nexora-api-rest/internal/domain"
)

type dummyReserveIDProvider struct{}

func (dummyReserveIDProvider) NewReserveID() domain.ReserveID {
	return domain.ReserveID("res-gen-1")
}

type mockReserveRepo struct {
	saved domain.Reserve
}

func (m *mockReserveRepo) EnsureTable(ctx context.Context) error {
	return nil
}

func (m *mockReserveRepo) FindAll(ctx context.Context) ([]domain.Reserve, error) {
	return nil, nil
}

func (m *mockReserveRepo) FindByID(ctx context.Context, id domain.ReserveID) (domain.Reserve, error) {
	return domain.Reserve{}, nil
}

func (m *mockReserveRepo) Save(ctx context.Context, reserve domain.Reserve) (domain.Reserve, error) {
	m.saved = reserve
	return reserve, nil
}

func (m *mockReserveRepo) Update(ctx context.Context, reserve domain.Reserve) (domain.Reserve, error) {
	return reserve, nil
}

func (m *mockReserveRepo) Delete(ctx context.Context, id domain.ReserveID) error {
	return nil
}

func TestCreateReserveUseCase_MultiplePersonsAndNoRoom(t *testing.T) {
	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Second)

	repo := &mockReserveRepo{}
	uc := reserveapp.NewCreateReserveUseCase(repo, dummyReserveIDProvider{})

	res, err := uc.Create(ctx, reserveapp.CreateInput{
		PersonIDs:    []domain.PersonID{"per-1", "per-2"},
		CheckInDate:  now,
		CheckOutDate: now.Add(24 * time.Hour),
		State:        "pending",
		TotalPrice:   200.0,
		CreatedBy:    "reception",
	})
	if err != nil {
		t.Fatalf("unexpected error creating reserve: %v", err)
	}

	if res.RoomID != "" {
		t.Errorf("expected empty roomID, got %s", res.RoomID)
	}
	if res.PersonID != "per-1" {
		t.Errorf("expected primary person 'per-1', got %s", res.PersonID)
	}
	if len(res.PersonIDs) != 2 {
		t.Errorf("expected 2 personIDs, got %d", len(res.PersonIDs))
	}
	if res.NumberOfGuests != 2 {
		t.Errorf("expected numberOfGuests 2 (derived from personIDs), got %d", res.NumberOfGuests)
	}
}
