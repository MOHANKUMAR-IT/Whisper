package main

import (
	"github.com/MOHANKUMAR-IT/Whisper/internal/signaling"
	"github.com/MOHANKUMAR-IT/Whisper/internal/web"
	"github.com/gin-gonic/gin"
	"log"
)

func main() {
	router := gin.Default()

	signaling.Register(router)

	web.Register(router)

	log.Println("Server is running on http://localhost:8080")
	if err := router.RunTLS(":8080", ".\\certs\\server.crt", ".\\certs\\server.key"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
