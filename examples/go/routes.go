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
	Counter *string `json:"counter,omitempty" db:"counter"`
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

func registerRoutes(r chi.Router, db *sqlx.DB) {
	categories := make(map[int]CategoryDto)
	cnt := 0

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
		var category CategoryDto
		json.NewDecoder(r.Body).Decode(&category)
		cnt += 1
		id := strconv.Itoa(cnt)
		category.Id = &id
		categories[cnt] = category
		w.WriteHeader(http.StatusNoContent)
	})

	r.Get("/v1/categories/{categoryId}", func(w http.ResponseWriter, r *http.Request) {
		nstmt, err := db.PrepareNamed("SELECT id , name , name_ru , slug FROM categories WHERE id = :categoryId")
		if err != nil {
			fmt.Fprintf(os.Stderr, "PrepareNamed failed: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var result CategoryDto
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
		id, _ := strconv.Atoi(chi.URLParam(r, "categoryId"))
		var category CategoryDto
		json.NewDecoder(r.Body).Decode(&category)
		categories[id] = category
		w.WriteHeader(http.StatusNoContent)
	})

	r.Delete("/v1/categories/{categoryId}", func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(chi.URLParam(r, "categoryId"))
		delete(categories, id)
		w.WriteHeader(http.StatusNoContent)
	})

}
