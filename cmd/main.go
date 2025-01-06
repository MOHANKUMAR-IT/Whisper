package main

import (
	_ "embed"
	"github.com/MOHANKUMAR-IT/Whisper/internal/signaling"
	"github.com/MOHANKUMAR-IT/Whisper/internal/web"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
)

func main() {

	router := gin.Default()

	signaling.Register(router)

	web.Register(router)

	server := &http.Server{
		Addr:    ":80",
		Handler: router,
	}

	log.Println("Starting Gin server on https://localhost:80")
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
