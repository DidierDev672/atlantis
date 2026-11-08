package person

import (
	"context"
	"strings"

	"nexora-api-rest/internal/domain"
)

// GetPersonByDocumentUseCase implements the "get person by document" vertical slice.
type GetPersonByDocumentUseCase struct {
	repo domain.PersonRepository
}

func NewGetPersonByDocumentUseCase(repo domain.PersonRepository) *GetPersonByDocumentUseCase {
	return &GetPersonByDocumentUseCase{repo: repo}
}

func (uc *GetPersonByDocumentUseCase) GetByDocument(ctx context.Context, documentType domain.DocumentType, documentNumber string) (domain.Person, error) {
	parsedDocType, err := domain.ParseDocumentType(string(documentType))
	if err != nil {
		return domain.Person{}, err
	}
	trimmedNum := strings.TrimSpace(documentNumber)
	if trimmedNum == "" {
		return domain.Person{}, domain.ErrInvalidPersonDocumentNumber
	}
	return uc.repo.FindByDocumentTypeAndDocumentNumber(ctx, parsedDocType, trimmedNum)
}
