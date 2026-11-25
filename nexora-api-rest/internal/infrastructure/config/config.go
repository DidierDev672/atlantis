package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Database struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
	Timezone string
}

func Load() error {
	return godotenv.Load()
}

// JWTSecret returns the symmetric key used to sign access tokens. It must be
// a high-entropy value loaded from the environment, never hardcoded.
func JWTSecret() string {
	return os.Getenv("JWT_SECRET")
}

// BootstrapConfig holds initial credentials and sede defaults used when
// provisioning a brand-new server installation.
type BootstrapConfig struct {
	SuperAdminEmail    string
	SuperAdminPassword string
	SuperAdminName     string
	AdminEmail         string
	AdminPassword      string
	AdminName          string
	ReceptionEmail     string
	ReceptionPassword  string
	ReceptionName      string
	HeadquarterName    string
	HeadquarterAddress string
	HeadquarterCity    string
	HeadquarterPhone   string
}

func envOrDefault(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

// Bootstrap returns the initial setup parameters for a fresh installation.
func Bootstrap() BootstrapConfig {
	return BootstrapConfig{
		SuperAdminEmail:    envOrDefault("BOOTSTRAP_SUPERADMIN_EMAIL", "soporte@nexora.com"),
		SuperAdminPassword: envOrDefault("BOOTSTRAP_SUPERADMIN_PASSWORD", "SoporteNexora2026*"),
		SuperAdminName:     envOrDefault("BOOTSTRAP_SUPERADMIN_NAME", "Soporte Técnico Nexora"),
		AdminEmail:         envOrDefault("BOOTSTRAP_ADMIN_EMAIL", "admin@hotel.com"),
		AdminPassword:      envOrDefault("BOOTSTRAP_ADMIN_PASSWORD", "AdminHotel2026*"),
		AdminName:          envOrDefault("BOOTSTRAP_ADMIN_NAME", "Administrador del Hotel"),
		ReceptionEmail:     envOrDefault("BOOTSTRAP_RECEPTION_EMAIL", "recepcion@hotel.com"),
		ReceptionPassword:  envOrDefault("BOOTSTRAP_RECEPTION_PASSWORD", "RecepcionHotel2026*"),
		ReceptionName:      envOrDefault("BOOTSTRAP_RECEPTION_NAME", "Recepcionista del Hotel"),
		HeadquarterName:    envOrDefault("BOOTSTRAP_HQ_NAME", "Sede Principal"),
		HeadquarterAddress: envOrDefault("BOOTSTRAP_HQ_ADDRESS", "Dirección Principal"),
		HeadquarterCity:    envOrDefault("BOOTSTRAP_HQ_CITY", "Bogotá"),
		HeadquarterPhone:   envOrDefault("BOOTSTRAP_HQ_PHONE", "3000000000"),
	}
}

// CORSAllowedOrigins returns the browser origins allowed to call the API,
// read from CORS_ALLOWED_ORIGINS (comma separated). Defaults to the local
// Vite origin so the API works out of the box.
func CORSAllowedOrigins() []string {
	raw := os.Getenv("CORS_ALLOWED_ORIGINS")
	if raw == "" {
		return []string{"http://localhost:5173"}
	}
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			origins = append(origins, p)
		}
	}
	return origins
}

func DatabaseURL() string {
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = os.Getenv("DB_SCHEMA")
	}
	db := Database{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		Name:     dbName,
		SSLMode:  os.Getenv("DB_SSLMODE"),
		Timezone: os.Getenv("DB_TIMEZONE"),
	}

	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s&timezone=%s",
		db.User, db.Password, db.Host, db.Port, db.Name, db.SSLMode, db.Timezone,
	)
}

// RateLimitConfig holds settings for HTTP rate limiting.
type RateLimitConfig struct {
	Enabled       bool
	RPS           float64
	Burst         int
	SkipLocalhost bool
}

// RateLimit returns the rate limiter settings loaded from environment variables.
// In development, localhost is skipped by default to prevent frontend reloads or
// multiple concurrent component fetches from hitting 429 Too Many Requests.
func RateLimit() RateLimitConfig {
	enabled := true
	if v := strings.ToLower(strings.TrimSpace(os.Getenv("RATE_LIMIT_ENABLED"))); v == "false" || v == "0" || v == "off" || v == "no" {
		enabled = false
	}

	skipLocalhost := true
	if v := strings.ToLower(strings.TrimSpace(os.Getenv("RATE_LIMIT_SKIP_LOCALHOST"))); v == "false" || v == "0" || v == "off" || v == "no" {
		skipLocalhost = false
	}

	rps := 100.0
	if v := strings.TrimSpace(os.Getenv("RATE_LIMIT_RPS")); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil && f > 0 {
			rps = f
		}
	}

	burst := 200
	if v := strings.TrimSpace(os.Getenv("RATE_LIMIT_BURST")); v != "" {
		if i, err := strconv.Atoi(v); err == nil && i > 0 {
			burst = i
		}
	}

	return RateLimitConfig{
		Enabled:       enabled,
		RPS:           rps,
		Burst:         burst,
		SkipLocalhost: skipLocalhost,
	}
}
