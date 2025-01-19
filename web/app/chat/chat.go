package chat

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// Handler for our logged-in user page.
func Handler(ctx *gin.Context) {
	session := sessions.Default(ctx)
	profile := session.Get("profile")
	subject := session.Get("subject")
	ctx.HTML(http.StatusOK, "chat.html", struct {
		Profile interface{}
		Subject interface{}
	}{
		Profile: profile,
		Subject: subject,
	})
}
