package guestattendant

import (
	"context"
)

// ListFilter encapsula los criterios de búsqueda para el listado de acompañantes.
type ListFilter struct {
	StayID *StayID
}

// Repository define el puerto de salida secundario para persistencia (DIP + LSP).
// Es completamente agnóstico de tecnologías como Postgres, Redis o memoria.
type Repository interface {
	Create(ctx context.Context, attendant GuestAttendant) error
	GetByID(ctx context.Context, id ID) (GuestAttendant, error)
	List(ctx context.Context, filter ListFilter) ([]GuestAttendant, error)
	Update(ctx context.Context, attendant GuestAttendant) error
	Delete(ctx context.Context, id ID) error
}

// StayChecker define un puerto angosto saliente hacia el slice/módulo de estadías o reservas (ISP).
type StayChecker interface {
	ValidateStayExists(ctx context.Context, stayID StayID) (bool, error)
}

// PersonChecker define un puerto angosto saliente hacia el slice/módulo de personas (ISP).
type PersonChecker interface {
	ValidatePersonExists(ctx context.Context, personID PersonID) (bool, error)
}
