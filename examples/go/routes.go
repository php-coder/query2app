package main

import "database/sql"
import "encoding/json"
import "fmt"
import "net/http"
import "os"
import "strconv"
import "github.com/go-chi/chi"
import "github.com/jmoiron/sqlx"

type Category struct {
	Id     int     `json:"id" db:"id"`
	Name   string  `json:"name" db:"name"`
	NameRu *string `json:"name_ru" db:"name_ru"`
	Slug   string  `json:"slug" db:"slug"`
}

type Dto1 struct {
	Counter *string `json:"counter,omitempty" db:"counter"`
}

type Dto3 struct {
	Id     *string `json:"id,omitempty" db:"id"`
	Name   *string `json:"name,omitempty" db:"name"`
	NameRu *string `json:"name_ru,omitempty" db:"name_ru"`
	Slug   *string `json:"slug,omitempty" db:"slug"`
}

type Dto4 struct {
	Name   *string `json:"name,omitempty" db:"name"`
	NameRu *string `json:"name_ru,omitempty" db:"name_ru"`
	Slug   *string `json:"slug,omitempty" db:"slug"`
	UserId *string `json:"user_id,omitempty" db:"user_id"`
}

func registerRoutes(r chi.Router, db *sqlx.DB) {
	categories := make(map[int]Category)
	cnt := 0

	r.Get("/v1/categories/count", func(w http.ResponseWriter, r *http.Request) {
		var result Dto1
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

		var result Dto1
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
		var result []Dto3
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
		var category Category
		json.NewDecoder(r.Body).Decode(&category)
		cnt += 1
		category.Id = cnt
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

		var result Dto3
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
		var category Category
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
