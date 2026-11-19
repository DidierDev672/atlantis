package billing

import (
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"nexora-api-rest/internal/api/httpjson"
	billingapp "nexora-api-rest/internal/application/billing"
	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/domain/billing"
)

// Handler exposes the HTTP endpoints for the billing vertical slice.
type Handler struct {
	uc *billingapp.UseCase
}

// NewHandler constructs a new billing HTTP Handler.
func NewHandler(uc *billingapp.UseCase) *Handler {
	return &Handler{uc: uc}
}

// Register binds all billing routes (without /api/v1 prefix) to the standard net/http ServeMux.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /folios", h.OpenFolio)
	mux.HandleFunc("POST /folio", h.OpenFolio)

	mux.HandleFunc("GET /folios/{id}", h.GetFolio)
	mux.HandleFunc("GET /folio/{id}", h.GetFolio)

	mux.HandleFunc("GET /folios", h.FindFolio)
	mux.HandleFunc("GET /folio", h.FindFolio)

	mux.HandleFunc("GET /folios/{id}/balance", h.GetBalance)
	mux.HandleFunc("GET /folio/{id}/balance", h.GetBalance)

	mux.HandleFunc("POST /folios/{id}/charges", h.PostCharge)
	mux.HandleFunc("POST /folio/{id}/charges", h.PostCharge)

	mux.HandleFunc("POST /folios/{id}/charges/{chargeId}/void", h.VoidCharge)
	mux.HandleFunc("POST /folio/{id}/charges/{chargeId}/void", h.VoidCharge)

	mux.HandleFunc("POST /folios/{id}/payments", h.RegisterPayment)
	mux.HandleFunc("POST /folio/{id}/payments", h.RegisterPayment)

	mux.HandleFunc("POST /folios/{id}/close", h.CloseFolio)
	mux.HandleFunc("POST /folio/{id}/close", h.CloseFolio)

	mux.HandleFunc("POST /stays/{stayId}/checkout", h.Checkout)
	mux.HandleFunc("POST /stay/{stayId}/checkout", h.Checkout)
}

// --- Request & Response DTOs ---

type openFolioRequest struct {
	ReserveID *string `json:"reserve_id"`
	StayID    *string `json:"stay_id"`
	PayerID   string  `json:"payer_id"`
	Currency  string  `json:"currency"`
}

type postChargeRequest struct {
	Type        string `json:"type"`
	SourceType  string `json:"source_type"`
	SourceID    string `json:"source_id"`
	Description string `json:"description"`
	Subtotal    int64  `json:"subtotal"`
	Taxes       int64  `json:"taxes"`
	Total       int64  `json:"total"`
}

type voidChargeRequest struct {
	Reason string `json:"reason"`
}

type registerPaymentRequest struct {
	PaidBy    string `json:"paid_by"`
	Kind      string `json:"kind"`
	Method    string `json:"method"`
	Amount    int64  `json:"amount"`
	Reference string `json:"reference"`
}

type checkoutRequest struct {
	PaidBy    string `json:"paid_by"`
	Method    string `json:"method"`
	Amount    int64  `json:"amount"`
	Reference string `json:"reference"`
}

// ChargeResponse is the JSON DTO for a Folio charge.
type ChargeResponse struct {
	ID          string     `json:"id"`
	FolioID     string     `json:"folio_id"`
	Type        string     `json:"type"`
	SourceType  string     `json:"source_type,omitempty"`
	SourceID    string     `json:"source_id,omitempty"`
	Description string     `json:"description"`
	Subtotal    int64      `json:"subtotal"`
	Taxes       int64      `json:"taxes"`
	Total       int64      `json:"total"`
	VoidReason  string     `json:"void_reason,omitempty"`
	PostedAt    time.Time  `json:"posted_at"`
	VoidedAt    *time.Time `json:"voided_at,omitempty"`
	CreatedBy   string     `json:"created_by"`
}

// PaymentResponse is the JSON DTO for a Folio payment.
type PaymentResponse struct {
	ID             string    `json:"id"`
	FolioID        string    `json:"folio_id"`
	PaidBy         string    `json:"paid_by"`
	Kind           string    `json:"kind"`
	Method         string    `json:"method"`
	Amount         int64     `json:"amount"`
	Reference      string    `json:"reference,omitempty"`
	IdempotencyKey string    `json:"idempotency_key"`
	ReceivedBy     string    `json:"received_by"`
	CreatedAt      time.Time `json:"created_at"`
}

// FolioResponse is the complete JSON projection of a Folio, including its calculated balance.
type FolioResponse struct {
	ID           string            `json:"id"`
	ReserveID    *string           `json:"reserve_id,omitempty"`
	StayID       *string           `json:"stay_id,omitempty"`
	PayerID      string            `json:"payer_id"`
	Currency     string            `json:"currency"`
	Status       string            `json:"status"`
	TotalCharges int64             `json:"total_charges"`
	TotalNetPaid int64             `json:"total_net_paid"`
	Balance      int64             `json:"balance"`
	Charges      []ChargeResponse  `json:"charges"`
	Payments     []PaymentResponse `json:"payments"`
	CreatedBy    string            `json:"created_by"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

func newFolioResponse(f billing.Folio) FolioResponse {
	var resID, stayID *string
	if f.ReserveID != nil && *f.ReserveID != "" {
		s := string(*f.ReserveID)
		resID = &s
	}
	if f.StayID != nil && *f.StayID != "" {
		s := string(*f.StayID)
		stayID = &s
	}

	charges := make([]ChargeResponse, len(f.Charges))
	for i, c := range f.Charges {
		charges[i] = ChargeResponse{
			ID:          string(c.ID),
			FolioID:     string(c.FolioID),
			Type:        string(c.Type),
			SourceType:  c.SourceType,
			SourceID:    c.SourceID,
			Description: c.Description,
			Subtotal:    int64(c.Subtotal),
			Taxes:       int64(c.Taxes),
			Total:       int64(c.Total),
			VoidReason:  c.VoidReason,
			PostedAt:    c.PostedAt,
			VoidedAt:    c.VoidedAt,
			CreatedBy:   c.CreatedBy,
		}
	}

	payments := make([]PaymentResponse, len(f.Payments))
	for i, p := range f.Payments {
		payments[i] = PaymentResponse{
			ID:             string(p.ID),
			FolioID:        string(p.FolioID),
			PaidBy:         string(p.PaidBy),
			Kind:           string(p.Kind),
			Method:         string(p.Method),
			Amount:         int64(p.Amount),
			Reference:      p.Reference,
			IdempotencyKey: p.IdempotencyKey,
			ReceivedBy:     p.ReceivedBy,
			CreatedAt:      p.CreatedAt,
		}
	}

	return FolioResponse{
		ID:           string(f.ID),
		ReserveID:    resID,
		StayID:       stayID,
		PayerID:      string(f.PayerID),
		Currency:     f.Currency,
		Status:       string(f.Status),
		TotalCharges: int64(f.TotalCharges()),
		TotalNetPaid: int64(f.TotalNetPaid()),
		Balance:      int64(f.Balance()),
		Charges:      charges,
		Payments:     payments,
		CreatedBy:    f.CreatedBy,
		CreatedAt:    f.CreatedAt,
		UpdatedAt:    f.UpdatedAt,
	}
}

// OpenFolio handles POST /folios.
func (h *Handler) OpenFolio(w http.ResponseWriter, r *http.Request) {
	var req openFolioRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var resID *domain.ReserveID
	if req.ReserveID != nil && strings.TrimSpace(*req.ReserveID) != "" {
		rid := domain.ReserveID(strings.TrimSpace(*req.ReserveID))
		resID = &rid
	}

	var stayID *domain.StayID
	if req.StayID != nil && strings.TrimSpace(*req.StayID) != "" {
		sid := domain.StayID(strings.TrimSpace(*req.StayID))
		stayID = &sid
	}

	folio, err := h.uc.OpenFolio(r.Context(), billingapp.OpenFolioInput{
		ReserveID: resID,
		StayID:    stayID,
		PayerID:   domain.PersonID(strings.TrimSpace(req.PayerID)),
		Currency:  req.Currency,
	})
	if err != nil {
		h.writeError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusCreated, newFolioResponse(folio))
}

// GetFolio handles GET /folios/{id}.
func (h *Handler) GetFolio(w http.ResponseWriter, r *http.Request) {
	id := billing.FolioID(strings.TrimSpace(r.PathValue("id")))
	if id == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "folio id is required")
		return
	}

	folio, err := h.uc.GetFolio(r.Context(), id)
	if err != nil {
		h.writeError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, newFolioResponse(folio))
}

// FindFolio handles GET /folios?stay_id=&reserve_id=.
func (h *Handler) FindFolio(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	stayID := domain.StayID(strings.TrimSpace(q.Get("stay_id")))
	reserveID := domain.ReserveID(strings.TrimSpace(q.Get("reserve_id")))

	if stayID == "" && reserveID == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "either stay_id or reserve_id query parameter is required")
		return
	}

	folio, err := h.uc.FindFolio(r.Context(), stayID, reserveID)
	if err != nil {
		h.writeError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, newFolioResponse(folio))
}

// GetBalance handles GET /folios/{id}/balance.
func (h *Handler) GetBalance(w http.ResponseWriter, r *http.Request) {
	id := billing.FolioID(strings.TrimSpace(r.PathValue("id")))
	if id == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "folio id is required")
		return
	}

	summary, err := h.uc.GetBalance(r.Context(), id)
	if err != nil {
		h.writeError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, summary)
}

// PostCharge handles POST /folios/{id}/charges.
func (h *Handler) PostCharge(w http.ResponseWriter, r *http.Request) {
	id := billing.FolioID(strings.TrimSpace(r.PathValue("id")))
	if id == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "folio id is required")
		return
	}

	var req postChargeRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	folio, _, err := h.uc.PostCharge(r.Context(), billingapp.PostChargeInput{
		FolioID:     id,
		Type:        req.Type,
		SourceType:  req.SourceType,
		SourceID:    req.SourceID,
		Description: req.Description,
		Subtotal:    billing.Money(req.Subtotal),
		Taxes:       billing.Money(req.Taxes),
		Total:       billing.Money(req.Total),
	})
	if err != nil {
		h.writeError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusCreated, newFolioResponse(folio))
}

// VoidCharge handles POST /folios/{id}/charges/{chargeId}/void.
func (h *Handler) VoidCharge(w http.ResponseWriter, r *http.Request) {
	folioID := billing.FolioID(strings.TrimSpace(r.PathValue("id")))
	chargeID := billing.ChargeID(strings.TrimSpace(r.PathValue("chargeId")))
	if folioID == "" || chargeID == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "folio id and chargeId are required")
		return
	}

	var req voidChargeRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	folio, _, err := h.uc.VoidCharge(r.Context(), billingapp.VoidChargeInput{
		FolioID:  folioID,
		ChargeID: chargeID,
		Reason:   req.Reason,
	})
	if err != nil {
		h.writeError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, newFolioResponse(folio))
}

// RegisterPayment handles POST /folios/{id}/payments.
// Requires the Idempotency-Key HTTP header.
func (h *Handler) RegisterPayment(w http.ResponseWriter, r *http.Request) {
	folioID := billing.FolioID(strings.TrimSpace(r.PathValue("id")))
	if folioID == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "folio id is required")
		return
	}

	idemKey := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
	if idemKey == "" {
		httpjson.WriteError(w, http.StatusBadRequest, billing.ErrMissingIdempotencyKey.Error())
		return
	}

	var req registerPaymentRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	folio, _, err := h.uc.RegisterPayment(r.Context(), billingapp.RegisterPaymentInput{
		FolioID:        folioID,
		PaidBy:         domain.PersonID(strings.TrimSpace(req.PaidBy)),
		Kind:           req.Kind,
		Method:         req.Method,
		Amount:         billing.Money(req.Amount),
		Reference:      req.Reference,
		IdempotencyKey: idemKey,
	})
	if err != nil {
		h.writeError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusCreated, newFolioResponse(folio))
}

// CloseFolio handles POST /folios/{id}/close.
func (h *Handler) CloseFolio(w http.ResponseWriter, r *http.Request) {
	folioID := billing.FolioID(strings.TrimSpace(r.PathValue("id")))
	if folioID == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "folio id is required")
		return
	}

	folio, err := h.uc.CloseFolio(r.Context(), folioID)
	if err != nil {
		h.writeError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, newFolioResponse(folio))
}

// Checkout handles POST /stays/{stayId}/checkout.
func (h *Handler) Checkout(w http.ResponseWriter, r *http.Request) {
	stayID := domain.StayID(strings.TrimSpace(r.PathValue("stayId")))
	if stayID == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "stayId is required")
		return
	}

	var payInput *billingapp.CheckoutPaymentInput
	if r.Body != nil {
		var req checkoutRequest
		err := httpjson.DecodeJSON(r, &req)
		if err != nil && !errors.Is(err, io.EOF) {
			httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if err == nil && req.Amount > 0 {
			idemKey := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
			payInput = &billingapp.CheckoutPaymentInput{
				PaidBy:         domain.PersonID(strings.TrimSpace(req.PaidBy)),
				Method:         req.Method,
				Amount:         billing.Money(req.Amount),
				Reference:      req.Reference,
				IdempotencyKey: idemKey,
			}
		}
	}

	folio, err := h.uc.Checkout(r.Context(), stayID, payInput)
	if err != nil {
		h.writeError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, newFolioResponse(folio))
}

func (h *Handler) writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, billing.ErrFolioNotFound),
		errors.Is(err, billing.ErrChargeNotFound),
		errors.Is(err, domain.ErrStayNotFound),
		errors.Is(err, domain.ErrReserveNotFound):
		httpjson.WriteError(w, http.StatusNotFound, err.Error())

	case errors.Is(err, billing.ErrInvalidFolioID),
		errors.Is(err, billing.ErrInvalidPayerID),
		errors.Is(err, billing.ErrInvalidPaidByID),
		errors.Is(err, billing.ErrMissingFolioAnchor),
		errors.Is(err, billing.ErrInvalidCurrency),
		errors.Is(err, billing.ErrInvalidChargeID),
		errors.Is(err, billing.ErrInvalidChargeType),
		errors.Is(err, billing.ErrInvalidPaymentID),
		errors.Is(err, billing.ErrInvalidPaymentKind),
		errors.Is(err, billing.ErrInvalidPaymentMethod),
		errors.Is(err, billing.ErrInvalidAmount),
		errors.Is(err, billing.ErrInvalidTaxAmount),
		errors.Is(err, billing.ErrTotalMismatch),
		errors.Is(err, billing.ErrMissingIdempotencyKey),
		errors.Is(err, billing.ErrMissingVoidReason):
		httpjson.WriteError(w, http.StatusBadRequest, err.Error())

	case errors.Is(err, billing.ErrFolioNotOpen),
		errors.Is(err, billing.ErrFolioImmutable),
		errors.Is(err, billing.ErrPendingBalance),
		errors.Is(err, billing.ErrDuplicatePayment),
		errors.Is(err, billing.ErrChargeAlreadyVoided),
		errors.Is(err, billing.ErrRefundExceedsPaid),
		errors.Is(err, billing.ErrStayAlreadyLinked):
		httpjson.WriteError(w, http.StatusConflict, err.Error())

	default:
		httpjson.WriteInternalError(w, err)
	}
}
