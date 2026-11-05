package user

import (
	"time"

	userapp "nexora-api-rest/internal/application/user"
	"nexora-api-rest/internal/domain"
)

// Handler composes the narrow use-case ports expected by the HTTP layer.
type Handler struct {
	Creator  userapp.UserCreator
	Lister   userapp.UserLister
	Getter   userapp.UserGetter
	Updater  userapp.UserUpdater
	Deleter  userapp.UserDeleter
	RoleRepo domain.RoleRepository
}

// userResponse is the HTTP projection of the domain entity. The password hash
// is intentionally NOT exposed by the API (security by design).
type userResponse struct {
	ID                string    `json:"id"`
	Name              string    `json:"name"`
	Email             string    `json:"email"`
	RoleID            string    `json:"role_id"`
	HeadquartersID    *string   `json:"headquarters_id"`
	HeadquartersIDs   []string  `json:"headquarters_ids"`
	AllHeadquarters   bool      `json:"all_headquarters"`
	SubHeadquartersID *string   `json:"sub_headquarters_id"`
	Status            string    `json:"status"`
	CreatedBy         string    `json:"created_by"`
	UpdatedBy         *string   `json:"updated_by,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func newUserResponse(u domain.User) userResponse {
	hqIDs := make([]string, 0, len(u.HeadquartersIDs))
	for _, hq := range u.HeadquartersIDs {
		hqIDs = append(hqIDs, string(hq))
	}
	return userResponse{
		ID:                string(u.ID),
		Name:              u.Name,
		Email:             u.Email,
		RoleID:            string(u.RoleID),
		HeadquartersID:    headquarterIDRef(u.HeadquartersID),
		HeadquartersIDs:   hqIDs,
		AllHeadquarters:   u.AllHeadquarters,
		SubHeadquartersID: subHeadquarterIDRef(u.SubHeadquartersID),
		Status:            string(u.Status),
		CreatedBy:         u.CreatedBy,
		UpdatedBy:         u.UpdatedBy,
		CreatedAt:         u.CreatedAt,
		UpdatedAt:         u.UpdatedAt,
	}
}

func headquarterIDRef(id *domain.HeadquarterID) *string {
	if id == nil {
		return nil
	}
	s := string(*id)
	return &s
}

func subHeadquarterIDRef(id *domain.SubHeadquarterID) *string {
	if id == nil {
		return nil
	}
	s := string(*id)
	return &s
}
