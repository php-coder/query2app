package main

import "fmt"
import "net/http"
import "os"
import "github.com/go-chi/chi"

func main() {
	r := chi.NewRouter()
	registerRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Println("Listen on " + port)
	err := http.ListenAndServe(":"+port, r)
	fmt.Fprintf(os.Stderr, "ListenAndServe failed: %v\n", err)
	os.Exit(1)
}
