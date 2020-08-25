package main

import "database/sql"
import "fmt"
import "net/http"
import "os"
import "github.com/go-chi/chi"

import _ "github.com/go-sql-driver/mysql"

func main() {
	mapper := func(name string) string {
		value := os.Getenv(name)
		switch name {
		case "DB_HOST":
			if value == "" {
				value = "localhost"
			}
		case "DB_NAME", "DB_USER", "DB_PASSWORD":
			if value == "" {
				fmt.Fprintf(os.Stderr, "%s env variable is not set or empty\n", name)
				os.Exit(1)
			}
		}
		return value
	}

	dsn := os.Expand("${DB_USER}:${DB_PASSWORD}@tcp(${DB_HOST}:3306)/${DB_NAME}", mapper)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "sql.Open failed: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		fmt.Fprintf(os.Stderr, "Ping failed: could not connect to database: %v\n", err)
		os.Exit(1)
	}

	r := chi.NewRouter()
	registerRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Println("Listen on " + port)
	err = http.ListenAndServe(":"+port, r)
	fmt.Fprintf(os.Stderr, "ListenAndServe failed: %v\n", err)
	os.Exit(1)
}
