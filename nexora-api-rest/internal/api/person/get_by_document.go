package person

import (
	"errors"
	"net/http"
	"strings"

	"nexora-api-rest/internal/api/httpjson"
	"nexora-api-rest/internal/domain"
)

// ByDocument is the HTTP entry point for retrieving a single person by document type and document number.
func (h *Handler) ByDocument(w http.ResponseWriter, r *http.Request) {
	rawDocType := strings.TrimSpace(r.URL.Query().Get("document_type"))
	if rawDocType == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "document_type is required")
		return
	}

	docType, err := domain.ParseDocumentType(rawDocType)
	if err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	docNum := strings.TrimSpace(r.URL.Query().Get("document_number"))
	if docNum == "" {
		httpjson.WriteError(w, http.StatusBadRequest, "document_number is required")
		return
	}

	person, err := h.ByDocumentGetter.GetByDocument(r.Context(), docType, docNum)
	if err != nil {
		if errors.Is(err, domain.ErrPersonNotFound) {
			httpjson.WriteError(w, http.StatusNotFound, "person not found")
			return
		}
		if errors.Is(err, domain.ErrInvalidPersonDocumentType) || errors.Is(err, domain.ErrInvalidPersonDocumentNumber) {
			httpjson.WriteError(w, http.StatusBadRequest, err.Error())
			return
		}
		httpjson.WriteInternalError(w, err)
		return
	}

	httpjson.WriteJSON(w, http.StatusOK, newPersonResponse(person))
}
