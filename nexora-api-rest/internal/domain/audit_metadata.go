package domain

import "time"

// AuditMetadata standardizes the 6 forensic audit fields across all entities:
// who created/updated/deleted the record and when each event happened.
type AuditMetadata struct {
	CreatedBy string     `json:"created_by"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedBy *string    `json:"updated_by,omitempty"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedBy *string    `json:"deleted_by,omitempty"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}
