package main

import (
	"crypto/tls"
	_ "embed"
	"github.com/MOHANKUMAR-IT/Whisper/internal/signaling"
	"github.com/MOHANKUMAR-IT/Whisper/internal/web"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
)

// Embed the certificate files
//
//go:embed certs/server.crt
var serverCert []byte

//go:embed certs/server.key
var serverKey []byte

func main() {

	// Load the embedded certificate and key
	cert, err := tls.X509KeyPair(serverCert, serverKey)
	if err != nil {
		log.Fatalf("failed to load TLS certificates: %v", err)
	}
	// Setup the TLS configuration
	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
	}
	router := gin.Default()

	signaling.Register(router)

	web.Register(router)

	// Create the HTTPS server with Gin
	server := &http.Server{
		Addr:      ":8080",
		Handler:   router,
		TLSConfig: tlsConfig,
	}

	// Start the server with HTTPS
	log.Println("Starting Gin server on https://localhost:8080")
	if err := server.ListenAndServeTLS("", ""); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
