package main

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/jmoiron/sqlx"
)

func registerCustomRoutes(r chi.Router, db *sqlx.DB) {

	r.Get("/custom/route", func(w http.ResponseWriter, r *http.Request) {
		result := map[string]bool{
			"custom": true,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(&result)
	})

}
