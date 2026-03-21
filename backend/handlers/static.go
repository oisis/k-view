package handlers

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// StaticFiles holds the embedded frontend assets.
// The folder 'dist' will be populated during the build process.
//go:embed dist/*
var StaticFiles embed.FS

// ServeStatic returns a middleware that serves embedded static files.
func ServeStatic() gin.HandlerFunc {
	// Root the filesystem at 'dist' so we don't have to include it in the URL path
	subFS, err := fs.Sub(StaticFiles, "dist")
	if err != nil {
		panic("failed to create sub filesystem from embedded assets: " + err.Error())
	}

	fileServer := http.FileServer(http.FS(subFS))

	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// If the request is for an API or other non-static route, skip this middleware
		if strings.HasPrefix(path, "/api") || strings.HasPrefix(path, "/healthz") || strings.HasPrefix(path, "/readyz") {
			c.Next()
			return
		}

		// Check if the file exists in the embedded FS
		f, err := subFS.Open(strings.TrimPrefix(path, "/"))
		if err == nil {
			f.Close()
			fileServer.ServeHTTP(c.Writer, c.Request)
			c.Abort()
			return
		}

		// Fallback to index.html for SPA routing (React Router)
		c.Request.URL.Path = "/"
		fileServer.ServeHTTP(c.Writer, c.Request)
		c.Abort()
	}
}
