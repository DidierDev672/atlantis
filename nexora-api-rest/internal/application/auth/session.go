package auth

import (
	"context"
	"strings"

	"nexora-api-rest/internal/domain"
)

// SessionUseCase resolves the user's role and allowed headquarters.
type SessionUseCase struct {
	users        domain.UserRepository
	roles        domain.RoleRepository
	headquarters domain.HeadquarterRepository
}

func NewSessionUseCase(users domain.UserRepository, roles domain.RoleRepository, headquarters domain.HeadquarterRepository) *SessionUseCase {
	return &SessionUseCase{
		users:        users,
		roles:        roles,
		headquarters: headquarters,
	}
}

func (uc *SessionUseCase) ResolveByEmail(ctx context.Context, email string) (SessionUser, error) {
	u, err := uc.users.FindByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		return SessionUser{}, err
	}
	return uc.buildSessionUser(ctx, u)
}

func (uc *SessionUseCase) ResolveByUserID(ctx context.Context, id domain.UserID) (SessionUser, error) {
	u, err := uc.users.FindByID(ctx, id)
	if err != nil {
		return SessionUser{}, err
	}
	return uc.buildSessionUser(ctx, u)
}

func (uc *SessionUseCase) buildSessionUser(ctx context.Context, u domain.User) (SessionUser, error) {
	var roleName string
	if uc.roles != nil {
		if r, err := uc.roles.FindByID(ctx, u.RoleID); err == nil {
			roleName = string(r.Name)
		}
	}

	hqIDsSet := make(map[string]struct{})
	hqIDs := make([]string, 0, len(u.HeadquartersIDs)+1)
	if u.HeadquartersID != nil && strings.TrimSpace(string(*u.HeadquartersID)) != "" {
		idStr := strings.TrimSpace(string(*u.HeadquartersID))
		hqIDsSet[idStr] = struct{}{}
		hqIDs = append(hqIDs, idStr)
	}
	for _, hqID := range u.HeadquartersIDs {
		idStr := strings.TrimSpace(string(hqID))
		if idStr == "" {
			continue
		}
		if _, exists := hqIDsSet[idStr]; !exists {
			hqIDsSet[idStr] = struct{}{}
			hqIDs = append(hqIDs, idStr)
		}
	}

	allRole := strings.EqualFold(roleName, domain.RoleSuperAdmin) || u.AllHeadquarters

	allowed := make([]HeadquarterSummary, 0)
	if uc.headquarters != nil {
		allHQs, err := uc.headquarters.FindAll(ctx)
		if err == nil {
			for _, hq := range allHQs {
				hqIDStr := string(hq.ID)
				if allRole {
					allowed = append(allowed, HeadquarterSummary{
						ID:   hqIDStr,
						Name: hq.Name,
						City: hq.City,
					})
				} else if _, ok := hqIDsSet[hqIDStr]; ok {
					allowed = append(allowed, HeadquarterSummary{
						ID:   hqIDStr,
						Name: hq.Name,
						City: hq.City,
					})
				}
			}
		}
	}

	var primaryHQ *string
	if u.HeadquartersID != nil && strings.TrimSpace(string(*u.HeadquartersID)) != "" {
		s := strings.TrimSpace(string(*u.HeadquartersID))
		primaryHQ = &s
	} else if len(allowed) > 0 {
		s := allowed[0].ID
		primaryHQ = &s
	}

	return SessionUser{
		ID:                  string(u.ID),
		Name:                u.Name,
		Email:               u.Email,
		RoleID:              string(u.RoleID),
		RoleName:            roleName,
		AllHeadquarters:     allRole,
		HeadquartersID:      primaryHQ,
		HeadquartersIDs:     hqIDs,
		AllowedHeadquarters: allowed,
	}, nil
}
