package main

import (
	_ "embed"
	"github.com/MOHANKUMAR-IT/Whisper/web/platform/authenticator"
	"github.com/MOHANKUMAR-IT/Whisper/web/platform/router"
	"github.com/joho/godotenv"
	"log"
	"net/http"
)

func main() {

	log.SetOutput(log.Writer())

	if err := godotenv.Load(); err != nil {
		log.Fatalf("Failed to load the env vars: %v", err)
	}

	auth, err := authenticator.New()
	if err != nil {
		log.Fatalf("Failed to initialize the authenticator: %v", err)
	}

	rtr := router.New(auth)

	server := &http.Server{
		Addr:    ":80",
		Handler: rtr,
	}

	log.Println("Starting Gin server on https://localhost:80")
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
