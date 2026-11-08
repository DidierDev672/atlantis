package stay

import (
	"context"
	"strings"
	"time"

	"nexora-api-rest/internal/domain"
)

// CreateInput contains the parameters needed to create a new stay.
// RoomID is optional: if omitted, it is automatically resolved from the reservation.
type CreateInput struct {
	RoomID          domain.RoomID
	ReservationID   domain.ReserveID
	PersonIDs       []domain.PersonID
	CheckInDate     time.Time
	CheckOutDate    time.Time
	PaymentMethod   string
	SecurityDeposit float64
	Remarks         string
	Status          string
	CreatedBy       string
}

// CreateStayUseCase handles the creation of a stay (Single Responsibility).
type CreateStayUseCase struct {
	repo          domain.StayRepository
	reserveFinder ReserveFinder
	idProvider    IDProvider
}

// NewCreateStayUseCase constructs the use case with its dependencies (DIP).
func NewCreateStayUseCase(repo domain.StayRepository, reserveFinder ReserveFinder, idProvider IDProvider) *CreateStayUseCase {
	return &CreateStayUseCase{
		repo:          repo,
		reserveFinder: reserveFinder,
		idProvider:    idProvider,
	}
}

// Create creates and persists a new stay, enforcing domain validation.
func (uc *CreateStayUseCase) Create(ctx context.Context, in CreateInput) (domain.Stay, error) {
	paymentMethod, err := domain.ParsePaymentMethod(in.PaymentMethod)
	if err != nil {
		return domain.Stay{}, err
	}

	status := domain.StayStatusProgress
	if strings.TrimSpace(in.Status) != "" {
		parsedStatus, err := domain.ParseStayStatus(in.Status)
		if err != nil {
			return domain.Stay{}, err
		}
		status = parsedStatus
	}

	roomID := in.RoomID
	if roomID == "" {
		if in.ReservationID == "" {
			return domain.Stay{}, domain.ErrInvalidStayReservationID
		}
		if uc.reserveFinder != nil {
			reserve, err := uc.reserveFinder.FindByID(ctx, in.ReservationID)
			if err != nil {
				return domain.Stay{}, err
			}
			roomID = reserve.RoomID
		}
	}

	stay, err := domain.NewStay(
		uc.idProvider.NewStayID(),
		roomID,
		in.ReservationID,
		in.PersonIDs,
		in.CheckInDate,
		in.CheckOutDate,
		paymentMethod,
		in.SecurityDeposit,
		in.Remarks,
		status,
		in.CreatedBy,
		time.Now().UTC(),
	)
	if err != nil {
		return domain.Stay{}, err
	}

	return uc.repo.Save(ctx, stay)
}
