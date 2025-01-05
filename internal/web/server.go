package web

import (
	"github.com/gin-gonic/gin"
	"path/filepath"
)

func Register(router *gin.Engine) {
	publicDir := filepath.Join("internal", "web", "public")

	router.Static("/assets", filepath.Join(publicDir, "assets"))

	router.StaticFile("/", filepath.Join(publicDir, "index.html"))
}
