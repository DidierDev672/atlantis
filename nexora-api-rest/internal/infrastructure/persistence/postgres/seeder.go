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

	// 5. Asegurar usuario recepcionista operativo
	receptionRoleID := roleIDs[domain.RoleReception]
	if receptionRoleID != "" && strings.TrimSpace(cfg.ReceptionEmail) != "" {
		if err := ensureSeedUser(ctx, conn, seedUserParams{
			Name:            cfg.ReceptionName,
			Email:           strings.ToLower(strings.TrimSpace(cfg.ReceptionEmail)),
			Password:        cfg.ReceptionPassword,
			RoleID:          receptionRoleID,
			HeadquarterID:   defaultHQID,
			AllHeadquarters: false,
			CreatedBy:       systemActor,
		}); err != nil {
			return fmt.Errorf("seed reception user: %w", err)
		}
	}

	// 6. Sembrar catálogo de módulos, recursos, permisos y matriz role_permissions (admin y reception)
	if err := seedRBACCatalog(ctx, conn, roleIDs); err != nil {
		return fmt.Errorf("seed RBAC catalog: %w", err)
	}

	return nil
}

type seedModuleDef struct {
	Code          string
	SortOrder     int16
	TypePath      string
	TypeComponent string
}

type seedResourceDef struct {
	ModuleCode   string
	Code         string
	Name         string
	Component    string
	SortOrder    int16
	ShowInMenu   bool
	Action       string
	Description  string
	ForReception bool
}

func seedRBACCatalog(ctx context.Context, conn *pgxpool.Pool, roleIDs map[string]string) error {
	modules := []seedModuleDef{
		{Code: "operacion", SortOrder: 1, TypePath: "/operacion", TypeComponent: "Operacion"},
		{Code: "configuracion_hotelera", SortOrder: 2, TypePath: "/configuracion-hotelera", TypeComponent: "ConfiguracionHotelera"},
		{Code: "accesos", SortOrder: 3, TypePath: "/accesos", TypeComponent: "Accesos"},
		{Code: "sistema", SortOrder: 4, TypePath: "/sistema", TypeComponent: "Sistema"},
	}

	moduleIDs := make(map[string]int, len(modules))
	for _, m := range modules {
		var modID int
		err := conn.QueryRow(ctx,
			"SELECT id FROM modules WHERE LOWER(TRIM(code)) = LOWER(TRIM($1)) OR LOWER(TRIM(type_path)) = LOWER(TRIM($2)) LIMIT 1",
			m.Code, m.TypePath,
		).Scan(&modID)
		if err != nil || modID == 0 {
			err = conn.QueryRow(ctx,
				`INSERT INTO modules (code, sort_order, type_path, type_component)
				 VALUES ($1, $2, $3, $4)
				 RETURNING id`,
				m.Code, m.SortOrder, m.TypePath, m.TypeComponent,
			).Scan(&modID)
			if err != nil {
				return fmt.Errorf("insert module %s: %w", m.Code, err)
			}
		}
		moduleIDs[m.Code] = modID
	}

	resources := []seedResourceDef{
		{ModuleCode: "operacion", Code: "home", Name: "Resumen de hoy", Component: "HomeOverview", SortOrder: 1, ShowInMenu: true, Action: "dashboard.view", Description: "Acceso al resumen ejecutivo y métricas generales del hotel", ForReception: false},
		{ModuleCode: "operacion", Code: "recepcion", Name: "Recepción y Check-in", Component: "RecepcionesPage", SortOrder: 2, ShowInMenu: true, Action: "reception.manage", Description: "Recepción de huéspedes, check-in, asignación de habitación y garantías", ForReception: true},
		{ModuleCode: "operacion", Code: "salidas", Name: "Salidas, Check-out y Facturación", Component: "SalidasRecepcionesPage", SortOrder: 3, ShowInMenu: true, Action: "checkout_billing.manage", Description: "Salida de huéspedes, check-out, cobro de folios y facturación", ForReception: true},
		{ModuleCode: "operacion", Code: "habitacion", Name: "Habitaciones y Asignación", Component: "HabitacionesPage", SortOrder: 4, ShowInMenu: true, Action: "rooms.operational", Description: "Consulta de inventario de habitaciones, disponibilidad y cambio de estado operativo", ForReception: true},
		{ModuleCode: "operacion", Code: "reservas", Name: "Reservas de Habitaciones", Component: "ReservasPage", SortOrder: 5, ShowInMenu: true, Action: "reserves.manage", Description: "Creación, modificación y seguimiento de reservaciones", ForReception: true},
		{ModuleCode: "operacion", Code: "servicios", Name: "Venta de Productos y Servicios de Habitación", Component: "ServicioHabitacionesPage", SortOrder: 6, ShowInMenu: true, Action: "services.sell_dispatch", Description: "Venta de productos en servicios del hotel, room service y cargo a la habitación", ForReception: true},
		{ModuleCode: "accesos", Code: "personas", Name: "Directorio de Personas y Huéspedes", Component: "PersonasPage", SortOrder: 7, ShowInMenu: true, Action: "persons.manage", Description: "Ingreso y actualización de datos de huéspedes, acompañantes y personal", ForReception: true},
		{ModuleCode: "accesos", Code: "usuarios", Name: "Usuarios del Sistema", Component: "UsuariosPage", SortOrder: 8, ShowInMenu: true, Action: "users.manage", Description: "Administración de usuarios operadores, credenciales y sedes", ForReception: false},
		{ModuleCode: "accesos", Code: "recursos", Name: "Asignación de Permisos", Component: "RecursosPage", SortOrder: 9, ShowInMenu: true, Action: "permissions.manage", Description: "Configuración de roles, recursos y políticas RBAC", ForReception: false},
		{ModuleCode: "accesos", Code: "perfil", Name: "Mi Perfil de Usuario", Component: "UserProfile", SortOrder: 10, ShowInMenu: false, Action: "profile.view", Description: "Consulta del perfil del usuario autenticado", ForReception: true},
		{ModuleCode: "configuracion_hotelera", Code: "sedes", Name: "Sedes y Sub-sedes", Component: "SedesView", SortOrder: 11, ShowInMenu: true, Action: "headquarters.manage", Description: "Administración de sedes, sub-sedes y edificios del hotel", ForReception: false},
		{ModuleCode: "configuracion_hotelera", Code: "cama", Name: "Tipos de Camas 3D", Component: "Cama3dPage", SortOrder: 12, ShowInMenu: true, Action: "beds.manage", Description: "Configuración de tipos de camas e inventario físico", ForReception: false},
		{ModuleCode: "configuracion_hotelera", Code: "tarifas", Name: "Tarifas del Hotel", Component: "TarifasPage", SortOrder: 13, ShowInMenu: true, Action: "rates.manage", Description: "Creación y configuración comercial de tarifas y planes", ForReception: false},
		{ModuleCode: "sistema", Code: "auditoria", Name: "Auditoría Operativa y Tarifaria", Component: "AuditoriaPage", SortOrder: 14, ShowInMenu: true, Action: "audit.view", Description: "Auditoría gerencial de habitaciones, tarifas e invariantes", ForReception: false},
		{ModuleCode: "sistema", Code: "paletas", Name: "Personalización Visual", Component: "PaletteView", SortOrder: 15, ShowInMenu: true, Action: "palettes.manage", Description: "Personalización de paletas de colores e identidad del hotel", ForReception: false},
		{ModuleCode: "sistema", Code: "configuracion", Name: "Configuración y Módulos", Component: "ConfiguracionesPage", SortOrder: 16, ShowInMenu: true, Action: "settings.manage", Description: "Panel maestro de configuración de módulos y catálogo de productos/categorías", ForReception: false},
	}

	adminRoles := []string{
		roleIDs[domain.RoleSuperAdmin],
		roleIDs[domain.RoleAdmin],
		roleIDs[domain.RoleManager],
	}
	receptionRoleID := roleIDs[domain.RoleReception]

	for _, res := range resources {
		modID := moduleIDs[res.ModuleCode]
		if modID == 0 {
			continue
		}

		var resID int
		err := conn.QueryRow(ctx,
			"SELECT id FROM resources WHERE LOWER(TRIM(code)) = LOWER(TRIM($1)) LIMIT 1",
			res.Code,
		).Scan(&resID)
		if err != nil || resID == 0 {
			err = conn.QueryRow(ctx,
				`INSERT INTO resources (module_id, code, name, sort_order, show_in_menu, component)
				 VALUES ($1, $2, $3, $4, $5, $6)
				 RETURNING id`,
				modID, res.Code, res.Name, res.SortOrder, res.ShowInMenu, res.Component,
			).Scan(&resID)
			if err != nil {
				return fmt.Errorf("insert resource %s: %w", res.Code, err)
			}
		}

		var permID int
		err = conn.QueryRow(ctx,
			"SELECT id FROM permission_resources WHERE resource_id = $1 AND action = $2 LIMIT 1",
			resID, res.Action,
		).Scan(&permID)
		if err != nil || permID == 0 {
			err = conn.QueryRow(ctx,
				`INSERT INTO permission_resources (resource_id, action, description, permission)
				 VALUES ($1, $2, $3, TRUE)
				 ON CONFLICT (resource_id, action) DO UPDATE SET permission = TRUE, description = EXCLUDED.description
				 RETURNING id`,
				resID, res.Action, res.Description,
			).Scan(&permID)
			if err != nil {
				return fmt.Errorf("insert permission_resource %s: %w", res.Action, err)
			}
		}

		permIDStr := fmt.Sprintf("%d", permID)

		// Asignar todos los permisos a los roles administrativos (admin, super_admin, manager)
		for _, rID := range adminRoles {
			if rID == "" {
				continue
			}
			_, _ = conn.Exec(ctx,
				`INSERT INTO role_permissions (id, role_id, permission_id, granted_at)
				 VALUES ($1, $2, $3, now())
				 ON CONFLICT (role_id, permission_id) DO NOTHING`,
				newSeedID(), rID, permIDStr,
			)
		}

		// Asignar permisos operativos y de facturación al rol recepcionista (reception)
		if res.ForReception && receptionRoleID != "" {
			_, _ = conn.Exec(ctx,
				`INSERT INTO role_permissions (id, role_id, permission_id, granted_at)
				 VALUES ($1, $2, $3, now())
				 ON CONFLICT (role_id, permission_id) DO NOTHING`,
				newSeedID(), receptionRoleID, permIDStr,
			)
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
		// Asegurar que tenga all_headquarters según su rol y vínculo con la sede inicial si aún no lo tenía
		_, _ = conn.Exec(ctx,
			`UPDATE users SET all_headquarters = $3, headquarters_id = COALESCE(headquarters_id, $2), deleted_at = NULL WHERE id = $1`,
			existingID, p.HeadquarterID, p.AllHeadquarters,
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
