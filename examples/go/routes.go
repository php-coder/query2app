package main

import "net/http"
import "github.com/go-chi/chi"

func registerRoutes(r chi.Router) {

	r.Get("/v1/categories/count", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("TODO"))
	})

	r.Get("/v1/collections/{collectionId}/categories/count", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("TODO"))
	})

	r.Get("/v1/categories", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("TODO"))
	})

	r.Post("/v1/categories", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	r.Get("/v1/categories/{categoryId}", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("TODO"))
	})

	r.Put("/v1/categories/{categoryId}", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	r.Delete("/v1/categories/{categoryId}", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

}
