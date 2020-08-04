package main

import "net/http"

func registerRoutes() {

	http.HandleFunc("/v1/categories/count", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("TODO"))
	})

	http.HandleFunc("/v1/collections/:collectionId/categories/count", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("TODO"))
	})

	http.HandleFunc("/v1/categories", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("TODO"))
	})

	http.HandleFunc("/v1/categories/:categoryId", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("TODO"))
	})

}
