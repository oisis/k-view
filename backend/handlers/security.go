package handlers

import (
	"os"
	"github.com/gin-gonic/gin"
)

// SecurityHeadersMiddleware adds security-related HTTP headers to every response.
func SecurityHeadersMiddleware() gin.HandlerFunc {
	devMode := os.Getenv("DEV_MODE") == "true"

	return func(c *gin.Context) {
		// Prevent Clickjacking
		c.Header("X-Frame-Options", "DENY")

		// Prevent MIME-sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Control how much information is shared in the Referer header
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Disable unused browser features
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()")

		// HSTS (Strict-Transport-Security) - only in production
		if !devMode {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		c.Next()
	}
}
