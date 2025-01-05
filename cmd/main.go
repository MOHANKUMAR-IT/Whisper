package main

import (
	"P2PFileShare/internal/signaling"
	"P2PFileShare/internal/web"
	"github.com/gin-gonic/gin"
	"log"
)

func main() {
	router := gin.Default()

	signaling.Register(router)

	web.Register(router)

	log.Println("Server is running on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
