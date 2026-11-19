package billing

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/domain/billing"
)

// StayPort defines the narrow port required from the Stay module for billing and checkout.
type StayPort interface {
	FindByID(ctx context.Context, id domain.StayID) (domain.Stay, error)
	Update(ctx context.Context, stay domain.Stay) (domain.Stay, error)
}

// ReservePort defines the narrow port required from the Reserve module for billing and checkout.
type ReservePort interface {
	FindByID(ctx context.Context, id domain.ReserveID) (domain.Reserve, error)
	Update(ctx context.Context, reserve domain.Reserve) (domain.Reserve, error)
}

// RoomPricingPort resolves the nightly or stay lodging amount in minor units when no reservation price is present.
type RoomPricingPort interface {
	ResolveStayLodgingPrice(ctx context.Context, stay domain.Stay) (billing.Money, error)
}

// ServiceRequestSnapshot is the decoupled value object received when a Room Service order changes status.
// Billing never imports the servicerequest package.
type ServiceRequestSnapshot struct {
	ID          string
	OrderNumber string
	Status      string
	Currency    string
	PersonID    domain.PersonID
	Subtotal    billing.Money
	Taxes       billing.Money
	Total       billing.Money
}

// BalanceSummary projects the financial summary of a Folio.
type BalanceSummary struct {
	FolioID      billing.FolioID     `json:"folio_id"`
	Currency     string              `json:"currency"`
	Status       billing.FolioStatus `json:"status"`
	TotalCharges billing.Money       `json:"total_charges"`
	TotalNetPaid billing.Money       `json:"total_net_paid"`
	Balance      billing.Money       `json:"balance"`
}

// OpenFolioInput holds parameters for opening or retrieving an existing Folio.
type OpenFolioInput struct {
	ReserveID *domain.ReserveID
	StayID    *domain.StayID
	PayerID   domain.PersonID
	Currency  string
}

// PostChargeInput holds parameters for posting a manual charge to a Folio.
type PostChargeInput struct {
	FolioID     billing.FolioID
	Type        string
	SourceType  string
	SourceID    string
	Description string
	Subtotal    billing.Money
	Taxes       billing.Money
	Total       billing.Money
}

// VoidChargeInput holds parameters for voiding a charge on a Folio.
type VoidChargeInput struct {
	FolioID  billing.FolioID
	ChargeID billing.ChargeID
	Reason   string
}

// RegisterPaymentInput holds parameters for recording a payment, advance, deposit, or refund.
type RegisterPaymentInput struct {
	FolioID        billing.FolioID
	PaidBy         domain.PersonID
	Kind           string
	Method         string
	Amount         billing.Money
	Reference      string
	IdempotencyKey string
}

// CheckoutPaymentInput holds optional payment details provided during guest checkout.
type CheckoutPaymentInput struct {
	PaidBy         domain.PersonID
	Method         string
	Amount         billing.Money
	Reference      string
	IdempotencyKey string
}

type systemClock struct{}

func (systemClock) Now() time.Time {
	return time.Now().UTC()
}

// UseCase orchestrates all application use cases for the billing vertical slice.
type UseCase struct {
	repo        billing.FolioRepository
	stayRepo    StayPort
	reserveRepo ReservePort
	roomPricer  RoomPricingPort
	ids         billing.IDGenerator
	clock       billing.Clock
}

// NewUseCase constructs the billing UseCase with its ports.
func NewUseCase(
	repo billing.FolioRepository,
	stayRepo StayPort,
	reserveRepo ReservePort,
	roomPricer RoomPricingPort,
	ids billing.IDGenerator,
	clock billing.Clock,
) *UseCase {
	if clock == nil {
		clock = systemClock{}
	}
	return &UseCase{
		repo:        repo,
		stayRepo:    stayRepo,
		reserveRepo: reserveRepo,
		roomPricer:  roomPricer,
		ids:         ids,
		clock:       clock,
	}
}

// OpenFolio opens a Folio from a Reserve or a Stay.
// - If an active folio already exists for the StayID, returns it (idempotent).
// - When opening for a Stay that has a ReservationID (either passed in input or loaded from Stay),
//   if a Folio already exists for that ReserveID, links it to the StayID and returns it.
// - If opening for a ReserveID only and a Folio already exists for that ReserveID, returns it (idempotent).
func (uc *UseCase) OpenFolio(ctx context.Context, in OpenFolioInput) (billing.Folio, error) {
	now := uc.clock.Now()
	actorID := domain.ActorAuditID(ctx, "")

	var cleanStayID *domain.StayID
	if in.StayID != nil && strings.TrimSpace(string(*in.StayID)) != "" {
		s := domain.StayID(strings.TrimSpace(string(*in.StayID)))
		cleanStayID = &s
	}

	var cleanReserveID *domain.ReserveID
	if in.ReserveID != nil && strings.TrimSpace(string(*in.ReserveID)) != "" {
		r := domain.ReserveID(strings.TrimSpace(string(*in.ReserveID)))
		cleanReserveID = &r
	}

	// 1. Check if an active folio already exists for StayID
	if cleanStayID != nil {
		existing, err := uc.repo.GetOpenByStayID(ctx, *cleanStayID)
		if err == nil {
			return existing, nil
		}
		if !errors.Is(err, billing.ErrFolioNotFound) {
			return billing.Folio{}, err
		}

		// If ReserveID was not explicitly passed, try resolving it from the Stay entity
		if cleanReserveID == nil && uc.stayRepo != nil {
			if st, sErr := uc.stayRepo.FindByID(ctx, *cleanStayID); sErr == nil {
				if strings.TrimSpace(string(st.ReservationID)) != "" {
					r := st.ReservationID
					cleanReserveID = &r
				}
				if strings.TrimSpace(string(in.PayerID)) == "" && len(st.PersonIDs) > 0 {
					in.PayerID = st.PersonIDs[0]
				}
			}
		}
	}

	// 2. Check if a folio already exists for ReserveID (and link StayID if checking in)
	if cleanReserveID != nil {
		existing, err := uc.repo.GetByReserveID(ctx, *cleanReserveID)
		if err == nil {
			if cleanStayID != nil && (existing.StayID == nil || *existing.StayID == "") {
				var updated billing.Folio
				mutErr := uc.repo.Mutate(ctx, existing.ID, func(f *billing.Folio) error {
					if err := f.LinkStay(*cleanStayID, now); err != nil {
						return err
					}
					updated = *f
					return nil
				})
				if mutErr != nil {
					return billing.Folio{}, mutErr
				}
				return updated, nil
			}
			return existing, nil
		}
		if !errors.Is(err, billing.ErrFolioNotFound) {
			return billing.Folio{}, err
		}
	}

	currency := strings.TrimSpace(in.Currency)
	if currency == "" {
		currency = "COP"
	}

	folio, err := billing.NewFolio(
		uc.ids.NewFolioID(),
		cleanReserveID,
		cleanStayID,
		in.PayerID,
		currency,
		actorID,
		now,
	)
	if err != nil {
		return billing.Folio{}, err
	}

	if err := uc.repo.Create(ctx, folio); err != nil {
		return billing.Folio{}, err
	}
	return folio, nil
}

// GetFolio retrieves a Folio by its ID.
func (uc *UseCase) GetFolio(ctx context.Context, id billing.FolioID) (billing.Folio, error) {
	cleanID := billing.FolioID(strings.TrimSpace(string(id)))
	if cleanID == "" {
		return billing.Folio{}, billing.ErrInvalidFolioID
	}
	return uc.repo.GetByID(ctx, cleanID)
}

// FindFolio locates a Folio by stay_id or reserve_id query parameters.
func (uc *UseCase) FindFolio(ctx context.Context, stayID domain.StayID, reserveID domain.ReserveID) (billing.Folio, error) {
	cleanStay := domain.StayID(strings.TrimSpace(string(stayID)))
	cleanReserve := domain.ReserveID(strings.TrimSpace(string(reserveID)))

	if cleanStay != "" {
		return uc.repo.GetOpenByStayID(ctx, cleanStay)
	}
	if cleanReserve != "" {
		return uc.repo.GetByReserveID(ctx, cleanReserve)
	}
	return billing.Folio{}, billing.ErrMissingFolioAnchor
}

// GetBalance returns the calculated balance summary of a Folio.
func (uc *UseCase) GetBalance(ctx context.Context, id billing.FolioID) (BalanceSummary, error) {
	f, err := uc.GetFolio(ctx, id)
	if err != nil {
		return BalanceSummary{}, err
	}
	return BalanceSummary{
		FolioID:      f.ID,
		Currency:     f.Currency,
		Status:       f.Status,
		TotalCharges: f.TotalCharges(),
		TotalNetPaid: f.TotalNetPaid(),
		Balance:      f.Balance(),
	}, nil
}

// PostCharge posts a manual charge (lodging, penalty, adjustment) to an open Folio.
func (uc *UseCase) PostCharge(ctx context.Context, in PostChargeInput) (billing.Folio, billing.Charge, error) {
	now := uc.clock.Now()
	actorID := domain.ActorAuditID(ctx, "")
	chargeType, err := billing.ParseChargeType(in.Type)
	if err != nil {
		return billing.Folio{}, billing.Charge{}, err
	}

	total := in.Total
	if total == 0 && in.Subtotal != 0 {
		total = in.Subtotal + in.Taxes
	}

	var updatedFolio billing.Folio
	var createdCharge billing.Charge

	err = uc.repo.Mutate(ctx, in.FolioID, func(f *billing.Folio) error {
		ch, err := f.PostCharge(
			uc.ids.NewChargeID(),
			chargeType,
			in.SourceType,
			in.SourceID,
			in.Description,
			in.Subtotal,
			in.Taxes,
			total,
			actorID,
			now,
		)
		if err != nil {
			return err
		}
		createdCharge = ch
		updatedFolio = *f
		return nil
	})
	if err != nil {
		return billing.Folio{}, billing.Charge{}, err
	}

	return updatedFolio, createdCharge, nil
}

// VoidCharge voids an existing charge on a Folio with a mandatory reason.
func (uc *UseCase) VoidCharge(ctx context.Context, in VoidChargeInput) (billing.Folio, billing.Charge, error) {
	now := uc.clock.Now()
	var updatedFolio billing.Folio
	var voidedCharge billing.Charge

	err := uc.repo.Mutate(ctx, in.FolioID, func(f *billing.Folio) error {
		ch, err := f.VoidCharge(in.ChargeID, in.Reason, now)
		if err != nil {
			return err
		}
		voidedCharge = ch
		updatedFolio = *f
		return nil
	})
	if err != nil {
		return billing.Folio{}, billing.Charge{}, err
	}

	return updatedFolio, voidedCharge, nil
}

// RegisterPayment records a payment, advance, deposit, or refund on a Folio using IdempotencyKey.
// If the IdempotencyKey was already processed on this Folio, returns the original payment without duplicating it.
func (uc *UseCase) RegisterPayment(ctx context.Context, in RegisterPaymentInput) (billing.Folio, billing.Payment, error) {
	now := uc.clock.Now()
	receivedBy := domain.ActorAuditID(ctx, "")

	kind, err := billing.ParsePaymentKind(in.Kind)
	if err != nil {
		return billing.Folio{}, billing.Payment{}, err
	}
	method, err := billing.ParsePaymentMethod(in.Method)
	if err != nil {
		return billing.Folio{}, billing.Payment{}, err
	}

	var updatedFolio billing.Folio
	var recordedPayment billing.Payment

	err = uc.repo.Mutate(ctx, in.FolioID, func(f *billing.Folio) error {
		p, err := f.RegisterPayment(
			uc.ids.NewPaymentID(),
			in.PaidBy,
			kind,
			method,
			in.Amount,
			in.Reference,
			in.IdempotencyKey,
			receivedBy,
			now,
		)
		if err != nil {
			return err
		}
		recordedPayment = p
		updatedFolio = *f
		return nil
	})
	if err != nil {
		return billing.Folio{}, billing.Payment{}, err
	}

	return updatedFolio, recordedPayment, nil
}

// CloseFolio closes a Folio if its balance is less than or equal to zero.
func (uc *UseCase) CloseFolio(ctx context.Context, folioID billing.FolioID) (billing.Folio, error) {
	now := uc.clock.Now()
	var updatedFolio billing.Folio

	err := uc.repo.Mutate(ctx, folioID, func(f *billing.Folio) error {
		if err := f.Close(now); err != nil {
			return err
		}
		updatedFolio = *f
		return nil
	})
	if err != nil {
		return billing.Folio{}, err
	}
	return updatedFolio, nil
}

// PostServiceRequestCharge handles room service order lifecycle events in a completely decoupled manner:
// - Only orders with Status == "delivered" generate a room_service charge (SourceType="service_request", SourceID=snap.ID).
// - Orders with Status == "canceled" or "rejected" void any previously posted charge for that SourceID.
// - Other statuses are ignored.
func (uc *UseCase) PostServiceRequestCharge(ctx context.Context, stayID domain.StayID, snap ServiceRequestSnapshot) error {
	status := strings.ToLower(strings.TrimSpace(snap.Status))
	now := uc.clock.Now()
	actorID := domain.ActorAuditID(ctx, "")

	switch status {
	case "delivered":
		folio, err := uc.repo.GetOpenByStayID(ctx, stayID)
		if errors.Is(err, billing.ErrFolioNotFound) {
			payerID := snap.PersonID
			if payerID == "" && uc.stayRepo != nil {
				if st, sErr := uc.stayRepo.FindByID(ctx, stayID); sErr == nil && len(st.PersonIDs) > 0 {
					payerID = st.PersonIDs[0]
				}
			}
			currency := snap.Currency
			if currency == "" {
				currency = "COP"
			}
			folio, err = uc.OpenFolio(ctx, OpenFolioInput{
				StayID:   &stayID,
				PayerID:  payerID,
				Currency: currency,
			})
		}
		if err != nil {
			return fmt.Errorf("resolve folio for service request: %w", err)
		}

		return uc.repo.Mutate(ctx, folio.ID, func(f *billing.Folio) error {
			if err := f.ReopenIfSettled(now); err != nil {
				return err
			}
			desc := fmt.Sprintf("Room Service Order #%s", strings.TrimSpace(snap.OrderNumber))
			_, err := f.PostCharge(
				uc.ids.NewChargeID(),
				billing.ChargeTypeRoomService,
				"service_request",
				snap.ID,
				desc,
				snap.Subtotal,
				snap.Taxes,
				snap.Total,
				actorID,
				now,
			)
			return err
		})

	case "canceled", "rejected":
		folio, err := uc.repo.GetOpenByStayID(ctx, stayID)
		if errors.Is(err, billing.ErrFolioNotFound) {
			return nil
		}
		if err != nil {
			return err
		}
		return uc.repo.Mutate(ctx, folio.ID, func(f *billing.Folio) error {
			_, err := f.VoidChargeBySource(
				"service_request",
				snap.ID,
				"Service request "+status,
				now,
			)
			return err
		})

	default:
		// Ignore non-delivered / non-canceled states.
		return nil
	}
}

// Checkout executes the complete guest checkout workflow:
// 1. Loads the Stay and ensures its Folio exists (linking the Reserve folio if applicable).
// 2. Posts the lodging charge if not already posted on the Folio.
// 3. Applies the Stay's security deposit if > 0 and not yet recorded on the Folio.
// 4. Registers the optional final payment if provided.
// 5. Calls Folio.Close() (fails with ErrPendingBalance if Balance() > 0).
// 6. Completes the Stay and (if linked) the Reserve.
func (uc *UseCase) Checkout(ctx context.Context, stayID domain.StayID, paymentIn *CheckoutPaymentInput) (billing.Folio, error) {
	if uc.stayRepo == nil {
		return billing.Folio{}, errors.New("stay repository port is not configured")
	}

	stay, err := uc.stayRepo.FindByID(ctx, stayID)
	if err != nil {
		return billing.Folio{}, err
	}

	var payerID domain.PersonID
	if len(stay.PersonIDs) > 0 {
		payerID = stay.PersonIDs[0]
	}

	var resIDPtr *domain.ReserveID
	if strings.TrimSpace(string(stay.ReservationID)) != "" {
		r := stay.ReservationID
		resIDPtr = &r
	}

	folio, err := uc.OpenFolio(ctx, OpenFolioInput{
		ReserveID: resIDPtr,
		StayID:    &stay.ID,
		PayerID:   payerID,
		Currency:  "COP",
	})
	if err != nil {
		return billing.Folio{}, err
	}

	lodgingAmount, err := uc.resolveLodgingAmount(ctx, stay)
	if err != nil {
		return billing.Folio{}, err
	}

	now := uc.clock.Now()
	actorID := domain.ActorAuditID(ctx, "")
	var closedFolio billing.Folio

	err = uc.repo.Mutate(ctx, folio.ID, func(f *billing.Folio) error {
		if f.Status == billing.FolioStatusClosed {
			closedFolio = *f
			return nil
		}

		// Ensure folio is open so missing lodging charges can be posted
		if err := f.ReopenIfSettled(now); err != nil {
			return err
		}

		// 1. Post lodging charge if no active lodging charge exists yet
		hasLodging := false
		for _, c := range f.Charges {
			if !c.IsVoided() && c.Type == billing.ChargeTypeLodging {
				hasLodging = true
				break
			}
		}
		if !hasLodging && lodgingAmount > 0 {
			_, err := f.PostCharge(
				uc.ids.NewChargeID(),
				billing.ChargeTypeLodging,
				"stay",
				string(stay.ID),
				fmt.Sprintf("Alojamiento habitación %s", stay.RoomID),
				lodgingAmount,
				0,
				lodgingAmount,
				actorID,
				now,
			)
			if err != nil {
				return err
			}
		}

		// 2. Apply security deposit from Stay if > 0 (idempotent via key "stay-deposit-<stayID>")
		depositMinor := billing.MoneyFromMajorUnits(stay.SecurityDeposit)
		if depositMinor > 0 {
			depKey := "stay-deposit-" + string(stay.ID)
			depMethod, mErr := billing.ParsePaymentMethod(string(stay.PaymentMethod))
			if mErr != nil {
				depMethod = billing.PaymentMethodCash
			}
			_, err := f.RegisterPayment(
				uc.ids.NewPaymentID(),
				f.PayerID,
				billing.PaymentKindDeposit,
				depMethod,
				depositMinor,
				"Depósito de garantía en check-in",
				depKey,
				actorID,
				now,
			)
			if err != nil {
				return err
			}
		}

		// 3. Register final checkout payment if provided
		if paymentIn != nil && paymentIn.Amount > 0 {
			method, err := billing.ParsePaymentMethod(paymentIn.Method)
			if err != nil {
				return err
			}
			idemKey := strings.TrimSpace(paymentIn.IdempotencyKey)
			if idemKey == "" {
				idemKey = "checkout-pay-" + string(stay.ID)
			}
			paidBy := paymentIn.PaidBy
			if paidBy == "" {
				paidBy = f.PayerID
			}
			_, err = f.RegisterPayment(
				uc.ids.NewPaymentID(),
				paidBy,
				billing.PaymentKindPayment,
				method,
				paymentIn.Amount,
				paymentIn.Reference,
				idemKey,
				actorID,
				now,
			)
			if err != nil {
				return err
			}
		}

		// 4. Close the folio (fails with ErrPendingBalance if Balance() > 0)
		if err := f.Close(now); err != nil {
			return err
		}

		closedFolio = *f
		return nil
	})
	if err != nil {
		return billing.Folio{}, err
	}

	// 5. Complete Stay and Reserve lifecycle states
	if stay.Status != domain.StayStatusCompleted {
		if err := stay.Complete(now); err != nil {
			return billing.Folio{}, err
		}
		if _, err := uc.stayRepo.Update(ctx, stay); err != nil {
			return billing.Folio{}, fmt.Errorf("complete stay on checkout: %w", err)
		}
	}

	if resIDPtr != nil && uc.reserveRepo != nil {
		if res, rErr := uc.reserveRepo.FindByID(ctx, *resIDPtr); rErr == nil && res.State != domain.ReserveStateCompleted {
			res.State = domain.ReserveStateCompleted
			res.UpdatedAt = now
			_, _ = uc.reserveRepo.Update(ctx, res)
		}
	}

	return closedFolio, nil
}

func (uc *UseCase) resolveLodgingAmount(ctx context.Context, stay domain.Stay) (billing.Money, error) {
	if strings.TrimSpace(string(stay.ReservationID)) != "" && uc.reserveRepo != nil {
		if res, err := uc.reserveRepo.FindByID(ctx, stay.ReservationID); err == nil && res.TotalPrice > 0 {
			return billing.MoneyFromMajorUnits(res.TotalPrice), nil
		}
	}
	if uc.roomPricer != nil {
		if price, err := uc.roomPricer.ResolveStayLodgingPrice(ctx, stay); err == nil && price > 0 {
			return price, nil
		}
	}
	return 0, nil
}

// RoomTariffPricer implements RoomPricingPort using RoomRepository and RoomTypeRepository.
type RoomTariffPricer struct {
	roomRepo     domain.RoomRepository
	roomTypeRepo domain.RoomTypeRepository
}

func NewRoomTariffPricer(roomRepo domain.RoomRepository, roomTypeRepo domain.RoomTypeRepository) *RoomTariffPricer {
	return &RoomTariffPricer{
		roomRepo:     roomRepo,
		roomTypeRepo: roomTypeRepo,
	}
}

func (p *RoomTariffPricer) ResolveStayLodgingPrice(ctx context.Context, stay domain.Stay) (billing.Money, error) {
	if p.roomRepo == nil {
		return 0, nil
	}
	room, err := p.roomRepo.FindByID(ctx, stay.RoomID)
	if err != nil {
		return 0, err
	}

	var nightlyMajor float64
	if room.PriceOverride != nil && *room.PriceOverride > 0 {
		nightlyMajor = float64(*room.PriceOverride)
	} else if p.roomTypeRepo != nil {
		if rt, err := p.roomTypeRepo.FindByID(ctx, room.RoomTypeID); err == nil {
			nightlyMajor = float64(rt.BasePrice)
		}
	}
	if nightlyMajor <= 0 {
		return 0, nil
	}

	nights := int(math.Ceil(stay.CheckOutDate.Sub(stay.CheckInDate).Hours() / 24.0))
	if nights < 1 {
		nights = 1
	}

	return billing.MoneyFromMajorUnits(nightlyMajor) * billing.Money(nights), nil
}
