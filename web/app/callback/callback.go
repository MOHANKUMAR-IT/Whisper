package callback

import (
	"github.com/MOHANKUMAR-IT/Whisper/web/platform/authenticator"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"net/http"
)

func Handler(auth *authenticator.Authenticator) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		session := sessions.Default(ctx)

		// Retrieve the session 'state'
		sessionState, ok := session.Get("state").(string)
		if !ok || sessionState == "" {
			ctx.String(http.StatusBadRequest, "Session state is missing or invalid.")
			return
		}

		// Compare state from URL query with session state
		//queryState := ctx.Query("state")
		//decodedState, err := url.QueryUnescape(queryState)
		//if err != nil {
		//	ctx.String(http.StatusBadRequest, "Failed to decode query state.")
		//	return
		//}
		//if decodedState != sessionState {
		//	ctx.String(http.StatusBadRequest, "Invalid state parameter.")
		//	return
		//}

		// Exchange authorization code for a token
		token, err := auth.Exchange(ctx.Request.Context(), ctx.Query("code"))
		if err != nil {
			ctx.String(http.StatusUnauthorized, "Failed to exchange authorization code for a token.")
			return
		}

		// Verify ID token
		idToken, err := auth.VerifyIDToken(ctx.Request.Context(), token)
		if err != nil {
			ctx.String(http.StatusInternalServerError, "Failed to verify ID Token.")
			return
		}

		// Extract user profile
		var profile map[string]interface{}
		if err := idToken.Claims(&profile); err != nil {
			ctx.String(http.StatusInternalServerError, err.Error())
			return
		}

		// Save access token and profile to session
		session.Set("access_token", token.AccessToken)
		session.Set("profile", profile)
		if err := session.Save(); err != nil {
			ctx.String(http.StatusInternalServerError, "Failed to save session: "+err.Error())
			return
		}

		// Redirect to user dashboard
		ctx.Redirect(http.StatusTemporaryRedirect, "/chat")
	}
}
