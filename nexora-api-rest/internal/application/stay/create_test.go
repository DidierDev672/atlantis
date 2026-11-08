package stay_test

import (
	"context"
	"errors"
	"testing"
	"time"

	stayapp "nexora-api-rest/internal/application/stay"
	"nexora-api-rest/internal/domain"
)

type dummyIDProvider struct{}

func (dummyIDProvider) NewStayID() domain.StayID {
	return domain.StayID("stay-generated-1")
}

type mockStayRepo struct {
	saved domain.Stay
}

func (m *mockStayRepo) EnsureTable(ctx context.Context) error {
	return nil
}

func (m *mockStayRepo) Save(ctx context.Context, stay domain.Stay) (domain.Stay, error) {
	m.saved = stay
	return stay, nil
}

func (m *mockStayRepo) FindAll(ctx context.Context) ([]domain.Stay, error) {
	return nil, nil
}

func (m *mockStayRepo) FindByID(ctx context.Context, id domain.StayID) (domain.Stay, error) {
	return domain.Stay{}, nil
}

func (m *mockStayRepo) FindByRoomID(ctx context.Context, roomID domain.RoomID) (domain.Stay, error) {
	return domain.Stay{}, nil
}

func (m *mockStayRepo) FindPersonsByStayID(ctx context.Context, stayID domain.StayID) ([]domain.Person, error) {
	return nil, nil
}

func (m *mockStayRepo) Update(ctx context.Context, stay domain.Stay) (domain.Stay, error) {
	return stay, nil
}

func (m *mockStayRepo) Delete(ctx context.Context, id domain.StayID) error {
	return nil
}

type mockReserveFinder struct {
	reserve domain.Reserve
	err     error
}

func (m *mockReserveFinder) FindByID(ctx context.Context, id domain.ReserveID) (domain.Reserve, error) {
	if m.err != nil {
		return domain.Reserve{}, m.err
	}
	return m.reserve, nil
}

func TestCreateStayUseCase_ResolvesRoomIDFromReservation(t *testing.T) {
	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Second)

	repo := &mockStayRepo{}
	finder := &mockReserveFinder{
		reserve: domain.Reserve{
			ID:     "res-100",
			RoomID: "room-from-reserve",
		},
	}

	uc := stayapp.NewCreateStayUseCase(repo, finder, dummyIDProvider{})

	stay, err := uc.Create(ctx, stayapp.CreateInput{
		ReservationID:   "res-100",
		PersonIDs:       []domain.PersonID{"per-1"},
		CheckInDate:     now,
		CheckOutDate:    now.Add(24 * time.Hour),
		PaymentMethod:   "card",
		SecurityDeposit: 50.0,
		Status:          "progress",
		CreatedBy:       "reception",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if stay.RoomID != "room-from-reserve" {
		t.Fatalf("expected roomID 'room-from-reserve', got '%s'", stay.RoomID)
	}
}

func TestCreateStayUseCase_ReservationNotFound(t *testing.T) {
	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Second)

	repo := &mockStayRepo{}
	finder := &mockReserveFinder{
		err: domain.ErrReserveNotFound,
	}

	uc := stayapp.NewCreateStayUseCase(repo, finder, dummyIDProvider{})

	_, err := uc.Create(ctx, stayapp.CreateInput{
		ReservationID:   "res-missing",
		PersonIDs:       []domain.PersonID{"per-1"},
		CheckInDate:     now,
		CheckOutDate:    now.Add(24 * time.Hour),
		PaymentMethod:   "card",
	})
	if !errors.Is(err, domain.ErrReserveNotFound) {
		t.Fatalf("expected ErrReserveNotFound, got %v", err)
	}
}
