package reserve

import (
	"context"
	"strings"
	"time"

	"nexora-api-rest/internal/domain"
)

// CreateInput contains the parameters needed to create a new reservation.
type CreateInput struct {
	RoomID         domain.RoomID
	PersonID       domain.PersonID
	PersonIDs      []domain.PersonID
	CheckInDate    time.Time
	CheckOutDate   time.Time
	NumberOfGuests int
	State          string
	TotalPrice     float64
	CreatedBy      string
}

// CreateReserveUseCase handles the creation of a reservation (Single Responsibility).
type CreateReserveUseCase struct {
	repo       domain.ReserveRepository
	idProvider IDProvider
}

// NewCreateReserveUseCase constructs the use case with its dependencies (DIP).
func NewCreateReserveUseCase(repo domain.ReserveRepository, idProvider IDProvider) *CreateReserveUseCase {
	return &CreateReserveUseCase{
		repo:       repo,
		idProvider: idProvider,
	}
}

// Create creates and persists a new reservation, enforcing domain validation.
func (uc *CreateReserveUseCase) Create(ctx context.Context, in CreateInput) (domain.Reserve, error) {
	state := domain.ReserveStatePending
	if strings.TrimSpace(in.State) != "" {
		parsedState, err := domain.ParseReserveState(in.State)
		if err != nil {
			return domain.Reserve{}, err
		}
		state = parsedState
	}

	personIDs := in.PersonIDs
	if len(personIDs) == 0 && strings.TrimSpace(string(in.PersonID)) != "" {
		personIDs = []domain.PersonID{in.PersonID}
	}

	numberOfGuests := in.NumberOfGuests
	if numberOfGuests <= 0 && len(personIDs) > 0 {
		numberOfGuests = len(personIDs)
	}

	reserve, err := domain.NewReserveWithPersons(
		uc.idProvider.NewReserveID(),
		in.RoomID,
		personIDs,
		in.CheckInDate,
		in.CheckOutDate,
		numberOfGuests,
		state,
		in.TotalPrice,
		in.CreatedBy,
		time.Now().UTC(),
	)
	if err != nil {
		return domain.Reserve{}, err
	}

	return uc.repo.Save(ctx, reserve)
}
