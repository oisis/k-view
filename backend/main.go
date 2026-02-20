package main

import (
	"log"
	"os"

	"k-view/handlers"
	"k-view/k8s"
	"k-view/rbac"

	"github.com/gin-gonic/gin"
)

func main() {
	devMode := os.Getenv("DEV_MODE") == "true"
	if devMode {
		log.Println("⚠️  DEVELOPMENT MODE ENABLED — Do not use in production!")
	}

	// Initialize SQLite Database
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "/data/kview.db"
	}
	db, err := rbac.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize Kubernetes Provider (real or mock based on DEV_MODE)
	var k8sProvider k8s.KubernetesProvider
	if devMode {
		log.Println("Using mock Kubernetes provider")
		k8sProvider = k8s.NewMockClient()
	} else {
		realClient, err := k8s.NewClient()
		if err != nil {
			log.Fatalf("Failed to initialize Kubernetes client: %v", err)
		}
		k8sProvider = realClient
	}

	// Initialize Auth Handler (skips OIDC setup in DEV_MODE)
	authHandler, err := handlers.NewAuthHandler(db)
	if err != nil {
		log.Fatalf("Failed to initialize Auth handler: %v", err)
	}

	podHandler := handlers.NewPodHandler(k8sProvider)
	nodeHandler := handlers.NewNodeHandler(k8sProvider)
	consoleHandler := handlers.NewConsoleHandler(devMode)
	resourceHandler := handlers.NewResourceHandler(devMode)
	adminHandler := handlers.NewAdminHandler(db)

	router := gin.Default()

	// Serve static frontend assets (JS, CSS, images compiled by Vite)
	router.Static("/assets", "./web/dist/assets")

	// SPA catch-all: any path that is not an API route will serve index.html,
	// allowing React Router to handle client-side routing (e.g. /admin, /login).
	router.NoRoute(func(c *gin.Context) {
		c.File("./web/dist/index.html")
	})

	// API Routes
	api := router.Group("/api")
	{
		// Public Auth routes
		api.GET("/auth/login", authHandler.Login)
		api.GET("/auth/callback", authHandler.Callback)
		api.POST("/auth/logout", authHandler.Logout)

		// Dev-mode only: bypass SSO login
		if devMode {
			api.POST("/auth/dev-login", authHandler.DevLogin)
		}

		// Protected routes — require a valid auth token
		protected := api.Group("/")
		protected.Use(authHandler.AuthMiddleware())
		{
			// /auth/me needs to be here so AuthMiddleware populates the email context
			protected.GET("/auth/me", authHandler.Me)
			protected.GET("/pods", podHandler.ListPods)
			protected.GET("/namespaces", podHandler.ListNamespaces)
			protected.GET("/nodes", nodeHandler.ListNodes)
			protected.POST("/console/exec", consoleHandler.Exec)
			protected.GET("/resources/:kind", resourceHandler.List)
			protected.GET("/cluster/stats", resourceHandler.GetStats)

			admin := protected.Group("/admin")
			admin.Use(authHandler.AdminMiddleware())
			{
				admin.GET("/users", adminHandler.ListUsers)
				admin.PUT("/users/:email/role", adminHandler.UpdateUserRole)
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting K-View on port %s", port)
	router.Run(":" + port)
}
