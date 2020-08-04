package main

import "fmt"
import "net/http"
import "os"

func main() {
	registerRoutes()

	fmt.Println("Listen on 3000")
	if err := http.ListenAndServe(":3000", nil); err != nil {
		fmt.Fprintf(os.Stderr, "ListenAndServe failed: %v", err)
		os.Exit(1)
	}
}
