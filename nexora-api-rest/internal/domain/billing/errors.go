package billing

import "errors"

// Typed sentinel errors for the billing domain.
var (
	ErrFolioNotFound          = errors.New("folio not found")
	ErrFolioNotOpen           = errors.New("folio must be open for this operation")
	ErrFolioImmutable         = errors.New("closed or void folio is immutable")
	ErrPendingBalance         = errors.New("cannot close folio with pending balance greater than zero")
	ErrDuplicatePayment       = errors.New("payment with this idempotency key already exists")
	ErrChargeNotFound         = errors.New("charge not found in folio")
	ErrChargeAlreadyVoided    = errors.New("charge is already voided")
	ErrInvalidAmount          = errors.New("monetary amount must be valid and greater than zero")
	ErrInvalidTaxAmount       = errors.New("tax amount cannot be negative")
	ErrTotalMismatch          = errors.New("charge total must equal subtotal plus taxes")
	ErrInvalidCurrency        = errors.New("currency code must be between 3 and 5 characters")
	ErrInvalidFolioID         = errors.New("folio id must not be empty")
	ErrInvalidPayerID         = errors.New("payer_id must not be empty")
	ErrInvalidPaidByID        = errors.New("paid_by must not be empty")
	ErrMissingFolioAnchor     = errors.New("at least one of reserve_id or stay_id is required")
	ErrInvalidChargeID        = errors.New("charge id must not be empty")
	ErrInvalidChargeType      = errors.New("charge type must be one of: lodging, room_service, penalty, adjustment")
	ErrInvalidPaymentID       = errors.New("payment id must not be empty")
	ErrInvalidPaymentKind     = errors.New("payment kind must be one of: advance, deposit, payment, refund")
	ErrInvalidPaymentMethod   = errors.New("payment method must be one of: cash, card, bank_transfer")
	ErrMissingIdempotencyKey  = errors.New("idempotency key is required")
	ErrRefundExceedsPaid      = errors.New("refund amount cannot exceed total net paid")
	ErrStayAlreadyLinked      = errors.New("folio is already linked to a different stay")
	ErrMissingVoidReason      = errors.New("void reason is required")
)
