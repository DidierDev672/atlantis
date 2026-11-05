package postgres

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"nexora-api-rest/internal/domain"
	"nexora-api-rest/internal/infrastructure/config"
)

func newSeedID() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}

type baseRoleSeed struct {
	Name        string
	Description string
}

var defaultRoles = []baseRoleSeed{
	{Name: domain.RoleSuperAdmin, Description: "Soporte Técnico / Super Administrador con control de creación de sedes"},
	{Name: domain.RoleAdmin, Description: "Administrador / Dueño del Hotel con control de infraestructura y personal"},
	{Name: domain.RoleReception, Description: "Recepcionista operativo para check-in, check-out y atención de huéspedes"},
	{Name: domain.RoleHousekeeping, Description: "Personal de limpieza y camarería"},
	{Name: domain.RoleManager, Description: "Supervisor o gerente operativo de sede"},
	{Name: domain.RoleGuest, Description: "Huésped con acceso al portal de servicios"},
}

// SeedInitialData garantiza de forma idempotente que en una instalación limpia existan:
// 1. Los 6 roles base del sistema.
// 2. La sede principal inicial del hotel (si aún no hay ninguna sede activa).
// 3. El usuario super_admin (soporte técnico).
// 4. El usuario admin inicial (dueño del hotel).
func SeedInitialData(ctx context.Context, conn *pgxpool.Pool, cfg config.BootstrapConfig) error {
	const systemActor = "bootstrap_seeder"

	roleIDs := make(map[string]string, len(defaultRoles))
	for _, r := range defaultRoles {
		var existingID string
		err := conn.QueryRow(ctx,
			"SELECT id FROM roles WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND deleted_at IS NULL LIMIT 1",
			r.Name,
		).Scan(&existingID)
		if err != nil {
			newID := newSeedID()
			_, insertErr := conn.Exec(ctx,
				`INSERT INTO roles (id, name, description, status, created_by, created_at, updated_at)
				 VALUES ($1, $2, $3, 'active', $4, now(), now())
				 ON CONFLICT (name) DO UPDATE SET deleted_at = NULL, status = 'active'
				 RETURNING id`,
				newID, r.Name, r.Description, systemActor,
			)
			if insertErr != nil {
				// Intentar recuperar por nombre si ya existía con conflicto
				_ = conn.QueryRow(ctx, "SELECT id FROM roles WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1", r.Name).Scan(&existingID)
				if existingID == "" {
					return fmt.Errorf("seed role %s: %w", r.Name, insertErr)
				}
			} else {
				existingID = newID
			}
			log.Printf("[SEEDER] Rol base asegurado: %s (%s)\n", r.Name, existingID)
		}
		roleIDs[r.Name] = existingID
	}

	// 2. Asegurar sede principal si no existe ninguna sede activa
	var defaultHQID string
	err := conn.QueryRow(ctx,
		"SELECT id FROM headquarters WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1",
	).Scan(&defaultHQID)
	if err != nil || defaultHQID == "" {
		defaultHQID = newSeedID()
		_, err = conn.Exec(ctx,
			`INSERT INTO headquarters (id, name, address, city, phone, status, created_by, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, 'active', $6, now(), now())`,
			defaultHQID,
			cfg.HeadquarterName,
			cfg.HeadquarterAddress,
			cfg.HeadquarterCity,
			cfg.HeadquarterPhone,
			systemActor,
		)
		if err != nil {
			return fmt.Errorf("seed initial headquarter: %w", err)
		}
		log.Printf("[SEEDER] Sede inicial creada: %s (%s)\n", cfg.HeadquarterName, defaultHQID)
	}

	// 3. Asegurar usuario super_admin (soporte técnico)
	superAdminRoleID := roleIDs[domain.RoleSuperAdmin]
	if superAdminRoleID != "" && strings.TrimSpace(cfg.SuperAdminEmail) != "" {
		if err := ensureSeedUser(ctx, conn, seedUserParams{
			Name:            cfg.SuperAdminName,
			Email:           strings.ToLower(strings.TrimSpace(cfg.SuperAdminEmail)),
			Password:        cfg.SuperAdminPassword,
			RoleID:          superAdminRoleID,
			HeadquarterID:   defaultHQID,
			AllHeadquarters: true,
			CreatedBy:       systemActor,
		}); err != nil {
			return fmt.Errorf("seed super_admin user: %w", err)
		}
	}

	// 4. Asegurar usuario admin (dueño del hotel)
	adminRoleID := roleIDs[domain.RoleAdmin]
	if adminRoleID != "" && strings.TrimSpace(cfg.AdminEmail) != "" {
		if err := ensureSeedUser(ctx, conn, seedUserParams{
			Name:            cfg.AdminName,
			Email:           strings.ToLower(strings.TrimSpace(cfg.AdminEmail)),
			Password:        cfg.AdminPassword,
			RoleID:          adminRoleID,
			HeadquarterID:   defaultHQID,
			AllHeadquarters: true,
			CreatedBy:       systemActor,
		}); err != nil {
			return fmt.Errorf("seed admin user: %w", err)
		}
	}

	return nil
}

type seedUserParams struct {
	Name            string
	Email           string
	Password        string
	RoleID          string
	HeadquarterID   string
	AllHeadquarters bool
	CreatedBy       string
}

func ensureSeedUser(ctx context.Context, conn *pgxpool.Pool, p seedUserParams) error {
	var existingID string
	err := conn.QueryRow(ctx,
		"SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1",
		p.Email,
	).Scan(&existingID)

	if err == nil && existingID != "" {
		// Asegurar que tenga all_headquarters y vínculo con la sede inicial si aún no lo tenía
		_, _ = conn.Exec(ctx,
			`UPDATE users SET all_headquarters = TRUE, headquarters_id = COALESCE(headquarters_id, $2), deleted_at = NULL WHERE id = $1`,
			existingID, p.HeadquarterID,
		)
		if p.HeadquarterID != "" {
			_, _ = conn.Exec(ctx,
				`INSERT INTO users_headquarters (user_id, headquarters_id, created_by, created_at)
				 VALUES ($1, $2, $3, now())
				 ON CONFLICT (user_id, headquarters_id) DO NOTHING`,
				existingID, p.HeadquarterID, p.CreatedBy,
			)
		}
		return nil
	}

	hashBytes, err := bcrypt.GenerateFromPassword([]byte(p.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password for %s: %w", p.Email, err)
	}

	userID := newSeedID()
	var hqPtr *string
	if p.HeadquarterID != "" {
		hqPtr = &p.HeadquarterID
	}

	_, err = conn.Exec(ctx,
		`INSERT INTO users (id, name, email, password_hash, role_id, headquarters_id, all_headquarters, status, created_by, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, now(), now())`,
		userID, p.Name, p.Email, string(hashBytes), p.RoleID, hqPtr, p.AllHeadquarters, p.CreatedBy,
	)
	if err != nil {
		return fmt.Errorf("insert seed user %s: %w", p.Email, err)
	}

	if p.HeadquarterID != "" {
		_, _ = conn.Exec(ctx,
			`INSERT INTO users_headquarters (user_id, headquarters_id, created_by, created_at)
			 VALUES ($1, $2, $3, now())
			 ON CONFLICT (user_id, headquarters_id) DO NOTHING`,
			userID, p.HeadquarterID, p.CreatedBy,
		)
	}

	log.Printf("[SEEDER] Usuario inicial creado: %s <%s>\n", p.Name, p.Email)
	return nil
}
