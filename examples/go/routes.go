package main

import "database/sql"
import "encoding/json"
import "fmt"
import "net/http"
import "os"
import "strconv"
import "github.com/go-chi/chi"
import "github.com/jmoiron/sqlx"

type CounterDto struct {
	Counter *int `json:"counter,omitempty" db:"counter"`
}

type CategoryDto struct {
	Id     *string `json:"id,omitempty" db:"id"`
	Name   *string `json:"name,omitempty" db:"name"`
	NameRu *string `json:"name_ru,omitempty" db:"name_ru"`
	Slug   *string `json:"slug,omitempty" db:"slug"`
}

type CreateCategoryDto struct {
	Name   *string `json:"name,omitempty" db:"name"`
	NameRu *string `json:"name_ru,omitempty" db:"name_ru"`
	Slug   *string `json:"slug,omitempty" db:"slug"`
	UserId *string `json:"user_id,omitempty" db:"user_id"`
}

type CategoryInfoDto struct {
	Id     *string `json:"id,omitempty" db:"id"`
	Name   *string `json:"name,omitempty" db:"name"`
	NameRu *string `json:"name_ru,omitempty" db:"name_ru"`
	Slug   *string `json:"slug,omitempty" db:"slug"`
}

func registerRoutes(r chi.Router, db *sqlx.DB) {
	categories := make(map[int]CategoryDto)

	r.Get("/v1/categories/count", func(w http.ResponseWriter, r *http.Request) {
		var result CounterDto
		err := db.Get(&result, "SELECT COUNT(*) AS counter FROM categories")
		switch err {
		case sql.ErrNoRows:
			w.WriteHeader(http.StatusNotFound)
		case nil:
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			json.NewEncoder(w).Encode(&result)
		default:
			fmt.Fprintf(os.Stderr, "Get failed: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
		}
	})

	r.Get("/v1/collections/{collectionId}/categories/count", func(w http.ResponseWriter, r *http.Request) {
		nstmt, err := db.PrepareNamed("SELECT COUNT(DISTINCT s.category_id) AS counter FROM collections_series cs JOIN series s ON s.id = cs.series_id WHERE cs.collection_id = :collectionId")
		if err != nil {
			fmt.Fprintf(os.Stderr, "PrepareNamed failed: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var result CounterDto
		args := map[string]interface{}{
			"collectionId": chi.URLParam(r, "collectionId"),
		}
		err = nstmt.Get(&result, args)
		switch err {
		case sql.ErrNoRows:
			w.WriteHeader(http.StatusNotFound)
		case nil:
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			json.NewEncoder(w).Encode(&result)
		default:
			fmt.Fprintf(os.Stderr, "Get failed: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
		}
	})

	r.Get("/v1/categories", func(w http.ResponseWriter, r *http.Request) {
		var result []CategoryDto
		err := db.Select(&result, "SELECT id , name , name_ru , slug FROM categories")
		switch err {
		case sql.ErrNoRows:
			w.WriteHeader(http.StatusNotFound)
		case nil:
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			json.NewEncoder(w).Encode(&result)
		default:
			fmt.Fprintf(os.Stderr, "Select failed: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
		}
	})

	r.Post("/v1/categories", func(w http.ResponseWriter, r *http.Request) {
		var dto CreateCategoryDto
		json.NewDecoder(r.Body).Decode(&dto)

		args := map[string]interface{}{
			"name": dto.Name,
			"name_ru": dto.NameRu,
			"slug": dto.Slug,
			"user_id": dto.UserId,
		}
		_, err := db.NamedExec(
			"INSERT INTO categories ( name , name_ru , slug , created_at , created_by , updated_at , updated_by ) VALUES ( :name , :name_ru , :slug , NOW() , :user_id , NOW() , :user_id )",
			args,
		)
		if err != nil {
			fmt.Fprintf(os.Stderr, "NamedExec failed: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	})

	r.Get("/v1/categories/{categoryId}", func(w http.ResponseWriter, r *http.Request) {
		nstmt, err := db.PrepareNamed("SELECT id , name , name_ru , slug FROM categories WHERE id = :categoryId")
		if err != nil {
			fmt.Fprintf(os.Stderr, "PrepareNamed failed: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var result CategoryInfoDto
		args := map[string]interface{}{
			"categoryId": chi.URLParam(r, "categoryId"),
		}
		err = nstmt.Get(&result, args)
		switch err {
		case sql.ErrNoRows:
			w.WriteHeader(http.StatusNotFound)
		case nil:
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			json.NewEncoder(w).Encode(&result)
		default:
			fmt.Fprintf(os.Stderr, "Get failed: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
		}
	})

	r.Put("/v1/categories/{categoryId}", func(w http.ResponseWriter, r *http.Request) {
		var dto CreateCategoryDto
		json.NewDecoder(r.Body).Decode(&dto)

		args := map[string]interface{}{
			"name": dto.Name,
			"name_ru": dto.NameRu,
			"slug": dto.Slug,
			"user_id": dto.UserId,
			"categoryId": chi.URLParam(r, "categoryId"),
		}
		_, err := db.NamedExec(
			"UPDATE categories SET name = :name , name_ru = :name_ru , slug = :slug , updated_at = NOW() , updated_by = :user_id WHERE id = :categoryId",
			args,
		)
		if err != nil {
			fmt.Fprintf(os.Stderr, "NamedExec failed: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	})

	r.Delete("/v1/categories/{categoryId}", func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(chi.URLParam(r, "categoryId"))
		delete(categories, id)
		w.WriteHeader(http.StatusNoContent)
	})

}
