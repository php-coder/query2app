package main

import "encoding/json"
import "fmt"
import "net/http"
import "strconv"
import "github.com/go-chi/chi"

type Category struct {
	Id     int     `json:"id"`
	Name   *string `json:"name"`
	NameRu *string `json:"name_ru"`
	Slug   *string `json:"slug"`
}

type Dto1 struct {
	Counter string `json:"counter"`
}

type Dto3 struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	NameRu string `json:"nameRu"`
	Slug   string `json:"slug"`
}

type Dto4 struct {
	Name   string `json:"name"`
	NameRu string `json:"nameRu"`
	Slug   string `json:"slug"`
	UserId string `json:"userId"`
}

func registerRoutes(r chi.Router) {
	categories := make(map[int]Category)
	cnt := 0

	r.Get("/v1/categories/count", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		fmt.Fprintf(w, `{"counter": %d}`, len(categories))

	})

	r.Get("/v1/collections/{collectionId}/categories/count", func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(chi.URLParam(r, "categoryId"))
		category, exist := categories[id]
		if !exist {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		json.NewEncoder(w).Encode(&category)

	})

	r.Get("/v1/categories", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		list := []Category{categories[1]}
		json.NewEncoder(w).Encode(&list)

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
		id, _ := strconv.Atoi(chi.URLParam(r, "categoryId"))
		category, exist := categories[id]
		if !exist {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		json.NewEncoder(w).Encode(&category)

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
