package router

import (
	"encoding/gob"
	"github.com/MOHANKUMAR-IT/Whisper/web/app/signaling"
	"path/filepath"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"

	"github.com/MOHANKUMAR-IT/Whisper/web/app/callback"
	"github.com/MOHANKUMAR-IT/Whisper/web/app/chat"
	"github.com/MOHANKUMAR-IT/Whisper/web/app/home"
	"github.com/MOHANKUMAR-IT/Whisper/web/app/login"
	"github.com/MOHANKUMAR-IT/Whisper/web/app/logout"
	"github.com/MOHANKUMAR-IT/Whisper/web/platform/authenticator"
	"github.com/MOHANKUMAR-IT/Whisper/web/platform/middleware"
)

// New registers the routes and returns the router.
func New(auth *authenticator.Authenticator) *gin.Engine {
	router := gin.New()

	// To store custom types in our cookies,
	// we must first register them using gob.Register
	gob.Register(map[string]interface{}{})

	store := cookie.NewStore([]byte("secret"))
	router.Use(sessions.Sessions("auth-session", store))

	staticDir := filepath.Join("web", "static")

	router.Static("/static", staticDir)
	router.LoadHTMLGlob("web/static/template/*")

	router.GET("/", home.Handler)
	router.GET("/login", login.Handler(auth))
	router.GET("/callback", callback.Handler(auth))
	router.GET("/chat", middleware.IsAuthenticated, chat.Handler)
	router.GET("/logout", logout.Handler)
	router.GET("/test", func(ctx *gin.Context) {
		ctx.HTML(200, "test.html", nil)
	})

	//router.StaticFile("/", filepath.Join(staticDir, "template", "index.html"))

	signaling.Register(router)

	return router
}
