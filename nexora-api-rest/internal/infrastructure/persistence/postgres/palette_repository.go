package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"nexora-api-rest/internal/domain"
)

type PaletteRepository struct {
	conn *pgxpool.Pool
}

func NewPaletteRepository(conn *pgxpool.Pool) *PaletteRepository {
	return &PaletteRepository{conn: conn}
}

var _ domain.PaletteRepository = (*PaletteRepository)(nil)

func (r *PaletteRepository) FindAll(ctx context.Context) ([]domain.Palette, error) {
	query := "SELECT id, name, is_defined, created_at FROM palettes WHERE deleted_at IS NULL"
	var args []any
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		query += " AND (headquarters_id = $1 OR headquarters_id IS NULL)"
		args = append(args, string(hqID))
	}
	rows, err := r.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query palettes: %w", err)
	}

	var palettes []domain.Palette
	for rows.Next() {
		var p domain.Palette
		if err := rows.Scan(&p.ID, &p.Name, &p.IsDefined, &p.CreatedAt); err != nil {
			rows.Close()
			return nil, fmt.Errorf("scan palette: %w", err)
		}
		palettes = append(palettes, p)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, err
	}
	rows.Close()

	for i := range palettes {
		if err := r.loadColors(ctx, &palettes[i]); err != nil {
			return nil, err
		}
	}
	return palettes, nil
}

func (r *PaletteRepository) FindByID(ctx context.Context, id domain.PaletteID) (domain.Palette, error) {
	var p domain.Palette
	err := r.conn.QueryRow(ctx, "SELECT id, name, is_defined, created_at FROM palettes WHERE id = $1 AND deleted_at IS NULL", id).
		Scan(&p.ID, &p.Name, &p.IsDefined, &p.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Palette{}, domain.ErrPaletteNotFound
		}
		return domain.Palette{}, fmt.Errorf("query palette by id: %w", err)
	}
	if err := r.loadColors(ctx, &p); err != nil {
		return domain.Palette{}, err
	}
	return p, nil
}

func (r *PaletteRepository) FindByName(ctx context.Context, name string) (domain.Palette, error) {
	var p domain.Palette
	query := "SELECT id, name, is_defined, created_at FROM palettes WHERE name = $1 AND deleted_at IS NULL"
	args := []any{name}
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		query += " AND headquarters_id = $2"
		args = append(args, string(hqID))
	}
	err := r.conn.QueryRow(ctx, query, args...).
		Scan(&p.ID, &p.Name, &p.IsDefined, &p.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Palette{}, domain.ErrPaletteNotFound
		}
		return domain.Palette{}, fmt.Errorf("query palette by name: %w", err)
	}
	if err := r.loadColors(ctx, &p); err != nil {
		return domain.Palette{}, err
	}
	return p, nil
}

func (r *PaletteRepository) Save(ctx context.Context, p domain.Palette) error {
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin save palette tx: %w", err)
	}
	defer tx.Rollback(ctx)

	createdBy := domain.ActorAuditID(ctx, "")
	var hqPtr *string
	if hqID, ok := domain.ActiveHeadquarterFromContext(ctx); ok {
		s := string(hqID)
		hqPtr = &s
	}

	_, err = tx.Exec(ctx,
		"INSERT INTO palettes (id, name, is_defined, headquarters_id, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, now())",
		p.ID, p.Name, p.IsDefined, hqPtr, createdBy, p.CreatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrPaletteDuplicated
		}
		return fmt.Errorf("insert palette: %w", err)
	}
	if err := insertColors(ctx, tx, p); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *PaletteRepository) Update(ctx context.Context, p domain.Palette) error {
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin update palette tx: %w", err)
	}
	defer tx.Rollback(ctx)

	updatedBy := domain.ActorAuditID(ctx, "")
	tag, err := tx.Exec(ctx,
		"UPDATE palettes SET name = $2, is_defined = $3, updated_by = $4, updated_at = now() WHERE id = $1 AND deleted_at IS NULL",
		p.ID, p.Name, p.IsDefined, updatedBy,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrPaletteDuplicated
		}
		return fmt.Errorf("update palette: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrPaletteNotFound
	}
	if _, err := tx.Exec(ctx, "DELETE FROM palette_colors WHERE palette_id = $1", p.ID); err != nil {
		return fmt.Errorf("clear palette colors: %w", err)
	}
	if err := insertColors(ctx, tx, p); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *PaletteRepository) Delete(ctx context.Context, id domain.PaletteID) error {
	deletedBy := domain.ActorAuditID(ctx, "")
	tag, err := r.conn.Exec(ctx,
		"UPDATE palettes SET deleted_at = now(), deleted_by = $2 WHERE id = $1 AND deleted_at IS NULL",
		id, deletedBy,
	)
	if err != nil {
		return fmt.Errorf("delete palette: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrPaletteNotFound
	}
	return nil
}

// loadColors fills the palette colors keeping their ordinal order.
func (r *PaletteRepository) loadColors(ctx context.Context, p *domain.Palette) error {
	rows, err := r.conn.Query(ctx,
		"SELECT hex, name FROM palette_colors WHERE palette_id = $1 ORDER BY position",
		p.ID,
	)
	if err != nil {
		return fmt.Errorf("query palette colors: %w", err)
	}
	defer rows.Close()

	p.Colors = p.Colors[:0]
	for rows.Next() {
		var c domain.Color
		if err := rows.Scan(&c.Hex, &c.Name); err != nil {
			return fmt.Errorf("scan palette color: %w", err)
		}
		p.Colors = append(p.Colors, c)
	}
	return rows.Err()
}

// insertColors writes the palette colors with their ordinal position.
func insertColors(ctx context.Context, tx pgx.Tx, p domain.Palette) error {
	for i, c := range p.Colors {
		if _, err := tx.Exec(ctx,
			"INSERT INTO palette_colors (palette_id, hex, name, position) VALUES ($1, $2, $3, $4)",
			p.ID, c.Hex, c.Name, i,
		); err != nil {
			return fmt.Errorf("insert palette color: %w", err)
		}
	}
	return nil
}
