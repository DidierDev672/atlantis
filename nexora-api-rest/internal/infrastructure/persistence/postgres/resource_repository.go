package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	externaldomain "nexora-api-rest/domain"
)

// ResourceRepository is the Postgres adapter of domain.ResourceRepository.
type ResourceRepository struct {
	conn *pgxpool.Pool
}

func NewResourceRepository(conn *pgxpool.Pool) *ResourceRepository {
	return &ResourceRepository{conn: conn}
}

var _ externaldomain.ResourceRepository = (*ResourceRepository)(nil)

func (r *ResourceRepository) Save(res *externaldomain.Resource) (int, error) {
	ctx := context.Background()
	if res.ID() <= 0 {
		var id int
		err := r.conn.QueryRow(ctx,
			"INSERT INTO resources (code, name, sort_order, show_in_menu, component, module_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
			res.Code(), res.Name().String(), res.SortOrder(), res.ShowInMenu(), res.Component().String(), res.ModuleID(),
		).Scan(&id)
		if err != nil {
			return 0, fmt.Errorf("insert resource: %w", err)
		}
		return id, nil
	}
	_, err := r.conn.Exec(ctx,
		`INSERT INTO resources (id, code, name, sort_order, show_in_menu, component, module_id) VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, show_in_menu = EXCLUDED.show_in_menu, component = EXCLUDED.component, module_id = EXCLUDED.module_id`,
		res.ID(), res.Code(), res.Name().String(), res.SortOrder(), res.ShowInMenu(), res.Component().String(), res.ModuleID(),
	)
	if err != nil {
		return 0, fmt.Errorf("upsert resource: %w", err)
	}
	return res.ID(), nil
}

func (r *ResourceRepository) FindByID(id int) (*externaldomain.Resource, error) {
	var dbID, moduleID int
	var code, component, name string
	var sortOrder int16
	var showInMenu bool
	err := r.conn.QueryRow(context.Background(),
		"SELECT id, COALESCE(code, ''), name, COALESCE(sort_order, 0), COALESCE(show_in_menu, true), COALESCE(component, ''), module_id FROM resources WHERE id = $1", id,
	).Scan(&dbID, &code, &name, &sortOrder, &showInMenu, &component, &moduleID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("recurso con ID %d no encontrado", id)
		}
		return nil, fmt.Errorf("query resource by id: %w", err)
	}
	res, _ := externaldomain.NewResourceWithDetails(dbID, code, externaldomain.ResourceName(name), sortOrder, showInMenu, externaldomain.Component(component), moduleID)
	return res, nil
}

func (r *ResourceRepository) FindByModuleID(moduleID int) ([]*externaldomain.Resource, error) {
	rows, err := r.conn.Query(context.Background(),
		"SELECT id, COALESCE(code, ''), name, COALESCE(sort_order, 0), COALESCE(show_in_menu, true), COALESCE(component, ''), module_id FROM resources WHERE module_id = $1 ORDER BY sort_order ASC, id ASC", moduleID)
	if err != nil {
		return nil, fmt.Errorf("query resources by module: %w", err)
	}
	defer rows.Close()

	var resources []*externaldomain.Resource
	for rows.Next() {
		var dbID int
		var code, component, name string
		var sortOrder int16
		var showInMenu bool
		if err := rows.Scan(&dbID, &code, &name, &sortOrder, &showInMenu, &component, &moduleID); err != nil {
			return nil, fmt.Errorf("scan resource: %w", err)
		}
		res, _ := externaldomain.NewResourceWithDetails(dbID, code, externaldomain.ResourceName(name), sortOrder, showInMenu, externaldomain.Component(component), moduleID)
		resources = append(resources, res)
	}
	return resources, rows.Err()
}

func (r *ResourceRepository) FindAll() ([]*externaldomain.Resource, error) {
	rows, err := r.conn.Query(context.Background(), "SELECT id, COALESCE(code, ''), name, COALESCE(sort_order, 0), COALESCE(show_in_menu, true), COALESCE(component, ''), module_id FROM resources ORDER BY sort_order ASC, id ASC")
	if err != nil {
		return nil, fmt.Errorf("query resources: %w", err)
	}
	defer rows.Close()

	var resources []*externaldomain.Resource
	for rows.Next() {
		var dbID, moduleID int
		var code, component, name string
		var sortOrder int16
		var showInMenu bool
		if err := rows.Scan(&dbID, &code, &name, &sortOrder, &showInMenu, &component, &moduleID); err != nil {
			return nil, fmt.Errorf("scan resource: %w", err)
		}
		res, _ := externaldomain.NewResourceWithDetails(dbID, code, externaldomain.ResourceName(name), sortOrder, showInMenu, externaldomain.Component(component), moduleID)
		resources = append(resources, res)
	}
	return resources, rows.Err()
}

func (r *ResourceRepository) Delete(id int) error {
	tag, err := r.conn.Exec(context.Background(), "DELETE FROM resources WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete resource: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("recurso con ID %d no encontrado", id)
	}
	return nil
}
