package guestattendant_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"nexora-api-rest/internal/guestattendant"
)

type mockRepo struct {
	items map[guestattendant.ID]guestattendant.GuestAttendant
}

func newMockRepo() *mockRepo {
	return &mockRepo{items: make(map[guestattendant.ID]guestattendant.GuestAttendant)}
}

func (m *mockRepo) Create(ctx context.Context, a guestattendant.GuestAttendant) error {
	m.items[a.ID] = a
	return nil
}

func (m *mockRepo) GetByID(ctx context.Context, id guestattendant.ID) (guestattendant.GuestAttendant, error) {
	item, ok := m.items[id]
	if !ok {
		return guestattendant.GuestAttendant{}, guestattendant.ErrNotFound
	}
	return item, nil
}

func (m *mockRepo) List(ctx context.Context, filter guestattendant.ListFilter) ([]guestattendant.GuestAttendant, error) {
	var res []guestattendant.GuestAttendant
	for _, v := range m.items {
		if filter.StayID != nil && v.StayID != *filter.StayID {
			continue
		}
		res = append(res, v)
	}
	return res, nil
}

func (m *mockRepo) Update(ctx context.Context, a guestattendant.GuestAttendant) error {
	if _, ok := m.items[a.ID]; !ok {
		return guestattendant.ErrNotFound
	}
	m.items[a.ID] = a
	return nil
}

func (m *mockRepo) Delete(ctx context.Context, id guestattendant.ID) error {
	if _, ok := m.items[id]; !ok {
		return guestattendant.ErrNotFound
	}
	delete(m.items, id)
	return nil
}

type fixedIDGen struct{ id guestattendant.ID }

func (f fixedIDGen) NewID() guestattendant.ID { return f.id }

type fixedClock struct{ now time.Time }

func (f fixedClock) Now() time.Time { return f.now }

func TestUseCase_CreateAndGet(t *testing.T) {
	repo := newMockRepo()
	now := time.Now().UTC()
	uc := guestattendant.NewUseCase(repo, nil, nil, fixedIDGen{id: "att-1"}, fixedClock{now: now})

	// 1. Create
	created, err := uc.Create(context.Background(), guestattendant.CreateInput{
		StayID:    "stay-100",
		PersonIDs: []string{"p-1", "p-2"},
	})
	if err != nil {
		t.Fatalf("unexpected create error: %v", err)
	}
	if created.ID != "att-1" {
		t.Errorf("expected ID att-1, got %v", created.ID)
	}

	// 2. GetByID
	fetched, err := uc.GetByID(context.Background(), "att-1")
	if err != nil {
		t.Fatalf("unexpected get error: %v", err)
	}
	if fetched.StayID != "stay-100" {
		t.Errorf("expected stay-100, got %v", fetched.StayID)
	}

	// 3. Update
	updated, err := uc.Update(context.Background(), guestattendant.UpdateInput{
		ID:        "att-1",
		PersonIDs: []string{"p-3"},
	})
	if err != nil {
		t.Fatalf("unexpected update error: %v", err)
	}
	if len(updated.PersonIDs) != 1 || updated.PersonIDs[0] != "p-3" {
		t.Errorf("expected person [p-3], got %v", updated.PersonIDs)
	}

	// 4. Delete
	if err := uc.Delete(context.Background(), "att-1"); err != nil {
		t.Fatalf("unexpected delete error: %v", err)
	}

	// 5. Get after delete -> ErrNotFound
	_, err = uc.GetByID(context.Background(), "att-1")
	if !errors.Is(err, guestattendant.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}
