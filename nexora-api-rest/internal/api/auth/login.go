package auth

import (
	"errors"
	"net/http"
	"strings"

	"nexora-api-rest/internal/api/httpjson"
	authapp "nexora-api-rest/internal/application/auth"
	"nexora-api-rest/internal/domain"
)

// Handler composes the narrow ports expected by the HTTP layer.
type Handler struct {
	Authenticator   authapp.Authenticator
	SessionResolver authapp.SessionResolver
}

// credentialsRequest is the payload accepted by POST /login. Validation is
// deliberately limited to presence/format: anything deeper must not leak
// whether the email exists, so it collapses into the generic 401.
type credentialsRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// loginResponse is the success projection: the signed token plus optional
// session profile when SessionResolver is configured.
type loginResponse struct {
	Token string               `json:"token"`
	User  *authapp.SessionUser `json:"user,omitempty"`
}

// Login is the HTTP entry point of the "login" slice.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req credentialsRequest
	if err := httpjson.DecodeJSON(r, &req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || req.Password == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	token, err := h.Authenticator.Authenticate(r.Context(), authapp.AuthenticateInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		if errors.Is(err, authapp.ErrInvalidCredentials) {
			// Same 401 for unknown email, wrong password and inactive
			// account: the response never reveals which part failed.
			httpjson.WriteError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		httpjson.WriteInternalError(w, err)
		return
	}

	resp := loginResponse{Token: token}
	if h.SessionResolver != nil {
		if sessionUser, sErr := h.SessionResolver.ResolveByEmail(r.Context(), req.Email); sErr == nil {
			resp.User = &sessionUser
		}
	}

	httpjson.WriteJSON(w, http.StatusOK, resp)
}

// Me returns the authenticated user's session profile and allowed headquarters.
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	actor, ok := domain.ActorFromContext(r.Context())
	if !ok || actor.UserID == "" {
		httpjson.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	if h.SessionResolver == nil {
		httpjson.WriteError(w, http.StatusNotImplemented, "session resolver not configured")
		return
	}

	sessionUser, err := h.SessionResolver.ResolveByUserID(r.Context(), actor.UserID)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			httpjson.WriteError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		httpjson.WriteInternalError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, sessionUser)
}
