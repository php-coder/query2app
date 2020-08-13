package main

import "fmt"
import "net/http"
import "os"
import "github.com/go-chi/chi"

func main() {
	r := chi.NewRouter()
	registerRoutes(r)

	fmt.Println("Listen on 3000")
	if err := http.ListenAndServe(":3000", r); err != nil {
		fmt.Fprintf(os.Stderr, "ListenAndServe failed: %v", err)
		os.Exit(1)
	}
}
