package billing

import (
	"strings"
	"time"

	"nexora-api-rest/internal/domain"
)

// Identifiers for the billing aggregate and its entities.
type (
	FolioID   string
	ChargeID  string
	PaymentID string
)

// FolioStatus represents the lifecycle state of a guest folio.
type FolioStatus string

const (
	FolioStatusOpen    FolioStatus = "open"
	FolioStatusSettled FolioStatus = "settled"
	FolioStatusClosed  FolioStatus = "closed"
	FolioStatusVoid    FolioStatus = "void"
)

// ChargeType classifies the nature of a charge posted to a folio.
type ChargeType string

const (
	ChargeTypeLodging     ChargeType = "lodging"
	ChargeTypeRoomService ChargeType = "room_service"
	ChargeTypePenalty     ChargeType = "penalty"
	ChargeTypeAdjustment  ChargeType = "adjustment"
)

func ParseChargeType(raw string) (ChargeType, error) {
	switch ChargeType(strings.ToLower(strings.TrimSpace(raw))) {
	case ChargeTypeLodging:
		return ChargeTypeLodging, nil
	case ChargeTypeRoomService:
		return ChargeTypeRoomService, nil
	case ChargeTypePenalty:
		return ChargeTypePenalty, nil
	case ChargeTypeAdjustment:
		return ChargeTypeAdjustment, nil
	default:
		return "", ErrInvalidChargeType
	}
}

// PaymentKind classifies the financial operation of a payment entry.
type PaymentKind string

const (
	PaymentKindAdvance PaymentKind = "advance"
	PaymentKindDeposit PaymentKind = "deposit"
	PaymentKindPayment PaymentKind = "payment"
	PaymentKindRefund  PaymentKind = "refund"
)

func ParsePaymentKind(raw string) (PaymentKind, error) {
	switch PaymentKind(strings.ToLower(strings.TrimSpace(raw))) {
	case PaymentKindAdvance:
		return PaymentKindAdvance, nil
	case PaymentKindDeposit:
		return PaymentKindDeposit, nil
	case PaymentKindPayment:
		return PaymentKindPayment, nil
	case PaymentKindRefund:
		return PaymentKindRefund, nil
	default:
		return "", ErrInvalidPaymentKind
	}
}

// PaymentMethod classifies the payment instrument used.
type PaymentMethod string

const (
	PaymentMethodCash         PaymentMethod = "cash"
	PaymentMethodCard         PaymentMethod = "card"
	PaymentMethodBankTransfer PaymentMethod = "bank_transfer"
)

func ParsePaymentMethod(raw string) (PaymentMethod, error) {
	normalized := strings.ToLower(strings.TrimSpace(raw))
	normalized = strings.ReplaceAll(normalized, " ", "_")
	switch PaymentMethod(normalized) {
	case PaymentMethodCash:
		return PaymentMethodCash, nil
	case PaymentMethodCard:
		return PaymentMethodCard, nil
	case PaymentMethodBankTransfer:
		return PaymentMethodBankTransfer, nil
	default:
		return "", ErrInvalidPaymentMethod
	}
}

// Charge represents an immutable financial debit on a Folio.
type Charge struct {
	ID          ChargeID
	FolioID     FolioID
	Type        ChargeType
	SourceType  string
	SourceID    string
	Description string
	Subtotal    Money
	Taxes       Money
	Total       Money
	VoidReason  string
	PostedAt    time.Time
	VoidedAt    *time.Time
	CreatedBy   string
}

// IsVoided reports whether the charge has been voided.
func (c Charge) IsVoided() bool {
	return c.VoidedAt != nil
}

// Payment represents an immutable financial credit (or refund debit) on a Folio.
type Payment struct {
	ID             PaymentID
	FolioID        FolioID
	PaidBy         domain.PersonID
	Kind           PaymentKind
	Method         PaymentMethod
	Amount         Money
	Reference      string
	IdempotencyKey string
	ReceivedBy     string
	CreatedAt      time.Time
}

// Folio is the aggregate root representing a guest's account.
type Folio struct {
	ID        FolioID
	ReserveID *domain.ReserveID
	StayID    *domain.StayID
	PayerID   domain.PersonID
	Currency  string
	Status    FolioStatus
	Charges   []Charge
	Payments  []Payment
	CreatedBy string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// NewFolio constructs a validated open Folio linked to at least one of ReserveID or StayID.
func NewFolio(
	id FolioID,
	reserveID *domain.ReserveID,
	stayID *domain.StayID,
	payerID domain.PersonID,
	currency string,
	createdBy string,
	now time.Time,
) (Folio, error) {
	trimmedID := FolioID(strings.TrimSpace(string(id)))
	if trimmedID == "" {
		return Folio{}, ErrInvalidFolioID
	}

	var cleanReserveID *domain.ReserveID
	if reserveID != nil {
		r := domain.ReserveID(strings.TrimSpace(string(*reserveID)))
		if r != "" {
			cleanReserveID = &r
		}
	}

	var cleanStayID *domain.StayID
	if stayID != nil {
		s := domain.StayID(strings.TrimSpace(string(*stayID)))
		if s != "" {
			cleanStayID = &s
		}
	}

	if cleanReserveID == nil && cleanStayID == nil {
		return Folio{}, ErrMissingFolioAnchor
	}

	cleanPayerID := domain.PersonID(strings.TrimSpace(string(payerID)))
	if cleanPayerID == "" {
		return Folio{}, ErrInvalidPayerID
	}

	curr, err := NormalizeCurrency(currency)
	if err != nil {
		return Folio{}, err
	}

	if now.IsZero() {
		now = time.Now().UTC()
	}

	return Folio{
		ID:        trimmedID,
		ReserveID: cleanReserveID,
		StayID:    cleanStayID,
		PayerID:   cleanPayerID,
		Currency:  curr,
		Status:    FolioStatusOpen,
		Charges:   make([]Charge, 0),
		Payments:  make([]Payment, 0),
		CreatedBy: strings.TrimSpace(createdBy),
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// TotalCharges returns the sum of all non-voided charges in minor units.
func (f Folio) TotalCharges() Money {
	var sum Money
	for _, c := range f.Charges {
		if !c.IsVoided() {
			sum += c.Total
		}
	}
	return sum
}

// TotalNetPaid returns the sum of non-refund payments minus refunds.
func (f Folio) TotalNetPaid() Money {
	var paid Money
	for _, p := range f.Payments {
		if p.Kind == PaymentKindRefund {
			paid -= p.Amount
		} else {
			paid += p.Amount
		}
	}
	return paid
}

// Balance computes the current balance (non-voided charges minus net payments).
// Calculated dynamically, never stored.
func (f Folio) Balance() Money {
	return f.TotalCharges() - f.TotalNetPaid()
}

// LinkStay attaches a StayID to a folio that originated from a reservation.
func (f *Folio) LinkStay(stayID domain.StayID, now time.Time) error {
	if f.Status == FolioStatusClosed || f.Status == FolioStatusVoid {
		return ErrFolioImmutable
	}
	cleanStay := domain.StayID(strings.TrimSpace(string(stayID)))
	if cleanStay == "" {
		return ErrMissingFolioAnchor
	}
	if f.StayID != nil && *f.StayID != "" && *f.StayID != cleanStay {
		return ErrStayAlreadyLinked
	}
	f.StayID = &cleanStay
	if !now.IsZero() {
		f.UpdatedAt = now
	}
	return nil
}

// PostCharge appends a new charge to the folio.
// - Allowed when folio is open (or settled, which re-opens it if a new charge increases balance > 0).
//   Note: Per domain rule "PostCharge: solo si el folio está open", if status != open we return ErrFolioNotOpen.
// - Idempotent by (SourceType, SourceID) when both are non-empty and an active (non-voided) charge already exists.
func (f *Folio) PostCharge(
	id ChargeID,
	chargeType ChargeType,
	sourceType string,
	sourceID string,
	description string,
	subtotal Money,
	taxes Money,
	total Money,
	createdBy string,
	now time.Time,
) (Charge, error) {
	if f.Status == FolioStatusClosed || f.Status == FolioStatusVoid {
		return Charge{}, ErrFolioImmutable
	}
	if f.Status != FolioStatusOpen {
		return Charge{}, ErrFolioNotOpen
	}

	cleanSourceType := strings.TrimSpace(sourceType)
	cleanSourceID := strings.TrimSpace(sourceID)

	// Idempotency check by (SourceType, SourceID) while not voided.
	if cleanSourceType != "" && cleanSourceID != "" {
		for _, existing := range f.Charges {
			if !existing.IsVoided() && existing.SourceType == cleanSourceType && existing.SourceID == cleanSourceID {
				return existing, nil
			}
		}
	}

	cleanID := ChargeID(strings.TrimSpace(string(id)))
	if cleanID == "" {
		return Charge{}, ErrInvalidChargeID
	}

	parsedType, err := ParseChargeType(string(chargeType))
	if err != nil {
		return Charge{}, err
	}

	if parsedType != ChargeTypeAdjustment {
		if subtotal <= 0 || total <= 0 {
			return Charge{}, ErrInvalidAmount
		}
		if taxes < 0 {
			return Charge{}, ErrInvalidTaxAmount
		}
	} else {
		if total == 0 {
			return Charge{}, ErrInvalidAmount
		}
	}

	if subtotal+taxes != total {
		return Charge{}, ErrTotalMismatch
	}

	if now.IsZero() {
		now = time.Now().UTC()
	}

	charge := Charge{
		ID:          cleanID,
		FolioID:     f.ID,
		Type:        parsedType,
		SourceType:  cleanSourceType,
		SourceID:    cleanSourceID,
		Description: strings.TrimSpace(description),
		Subtotal:    subtotal,
		Taxes:       taxes,
		Total:       total,
		PostedAt:    now,
		CreatedBy:   strings.TrimSpace(createdBy),
	}

	f.Charges = append(f.Charges, charge)
	f.UpdatedAt = now
	return charge, nil
}

// VoidCharge marks an existing charge as voided without deleting it.
func (f *Folio) VoidCharge(chargeID ChargeID, reason string, now time.Time) (Charge, error) {
	if f.Status == FolioStatusClosed || f.Status == FolioStatusVoid {
		return Charge{}, ErrFolioImmutable
	}
	cleanReason := strings.TrimSpace(reason)
	if cleanReason == "" {
		return Charge{}, ErrMissingVoidReason
	}
	if now.IsZero() {
		now = time.Now().UTC()
	}

	for i := range f.Charges {
		if f.Charges[i].ID == chargeID {
			if f.Charges[i].IsVoided() {
				return Charge{}, ErrChargeAlreadyVoided
			}
			voidTime := now
			f.Charges[i].VoidedAt = &voidTime
			f.Charges[i].VoidReason = cleanReason
			f.UpdatedAt = now

			if f.Balance() == 0 && len(f.Payments) > 0 {
				f.Status = FolioStatusSettled
			} else if f.Status == FolioStatusSettled && f.Balance() > 0 {
				f.Status = FolioStatusOpen
			}
			return f.Charges[i], nil
		}
	}

	return Charge{}, ErrChargeNotFound
}

// VoidChargeBySource voids an active charge matching (sourceType, sourceID).
func (f *Folio) VoidChargeBySource(sourceType, sourceID, reason string, now time.Time) (*Charge, error) {
	cleanSourceType := strings.TrimSpace(sourceType)
	cleanSourceID := strings.TrimSpace(sourceID)
	for _, c := range f.Charges {
		if !c.IsVoided() && c.SourceType == cleanSourceType && c.SourceID == cleanSourceID {
			voided, err := f.VoidCharge(c.ID, reason, now)
			if err != nil {
				return nil, err
			}
			return &voided, nil
		}
	}
	return nil, nil
}

// RegisterPayment records an advance, deposit, payment, or refund on the folio.
// - Allowed in open and settled states.
// - Idempotent by IdempotencyKey: if the key already exists on this folio, returns the original payment.
// - A refund cannot exceed TotalNetPaid().
// - If Balance() reaches 0 (and at least one charge or payment exists), transitions to settled;
//   if a refund makes Balance() > 0 again, transitions back to open.
func (f *Folio) RegisterPayment(
	id PaymentID,
	paidBy domain.PersonID,
	kind PaymentKind,
	method PaymentMethod,
	amount Money,
	reference string,
	idempotencyKey string,
	receivedBy string,
	now time.Time,
) (Payment, error) {
	if f.Status == FolioStatusClosed || f.Status == FolioStatusVoid {
		return Payment{}, ErrFolioImmutable
	}
	if f.Status != FolioStatusOpen && f.Status != FolioStatusSettled {
		return Payment{}, ErrFolioNotOpen
	}

	cleanKey := strings.TrimSpace(idempotencyKey)
	if cleanKey == "" {
		return Payment{}, ErrMissingIdempotencyKey
	}

	// Idempotent check within the aggregate
	for _, existing := range f.Payments {
		if existing.IdempotencyKey == cleanKey {
			return existing, nil
		}
	}

	cleanID := PaymentID(strings.TrimSpace(string(id)))
	if cleanID == "" {
		return Payment{}, ErrInvalidPaymentID
	}

	cleanPaidBy := domain.PersonID(strings.TrimSpace(string(paidBy)))
	if cleanPaidBy == "" {
		cleanPaidBy = f.PayerID
	}

	parsedKind, err := ParsePaymentKind(string(kind))
	if err != nil {
		return Payment{}, err
	}

	parsedMethod, err := ParsePaymentMethod(string(method))
	if err != nil {
		return Payment{}, err
	}

	if amount <= 0 {
		return Payment{}, ErrInvalidAmount
	}

	if parsedKind == PaymentKindRefund && amount > f.TotalNetPaid() {
		return Payment{}, ErrRefundExceedsPaid
	}

	if now.IsZero() {
		now = time.Now().UTC()
	}

	payment := Payment{
		ID:             cleanID,
		FolioID:        f.ID,
		PaidBy:         cleanPaidBy,
		Kind:           parsedKind,
		Method:         parsedMethod,
		Amount:         amount,
		Reference:      strings.TrimSpace(reference),
		IdempotencyKey: cleanKey,
		ReceivedBy:     strings.TrimSpace(receivedBy),
		CreatedAt:      now,
	}

	f.Payments = append(f.Payments, payment)
	f.UpdatedAt = now

	if f.TotalCharges() > 0 && f.Balance() == 0 {
		f.Status = FolioStatusSettled
	} else if f.Status == FolioStatusSettled && f.Balance() > 0 {
		f.Status = FolioStatusOpen
	}

	return payment, nil
}

// ReopenIfSettled transitions a settled folio back to open so new charges can be posted before checkout.
func (f *Folio) ReopenIfSettled(now time.Time) error {
	if f.Status == FolioStatusClosed || f.Status == FolioStatusVoid {
		return ErrFolioImmutable
	}
	if f.Status == FolioStatusSettled {
		f.Status = FolioStatusOpen
		if !now.IsZero() {
			f.UpdatedAt = now
		}
	}
	return nil
}

// Close finalizes the folio. Fails with ErrPendingBalance if Balance() > 0.
// Once closed, the folio is immutable.
func (f *Folio) Close(now time.Time) error {
	if f.Status == FolioStatusClosed {
		return nil
	}
	if f.Status == FolioStatusVoid {
		return ErrFolioImmutable
	}
	if f.Balance() > 0 {
		return ErrPendingBalance
	}
	if now.IsZero() {
		now = time.Now().UTC()
	}
	f.Status = FolioStatusClosed
	f.UpdatedAt = now
	return nil
}
