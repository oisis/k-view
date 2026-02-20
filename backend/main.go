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

	// Initialize Kubernetes Client
	k8sClient, err := k8s.NewClient()
	if err != nil {
		log.Fatalf("Failed to initialize Kubernetes client: %v", err)
	}

	// Initialize OIDC Provider
	authHandler, err := handlers.NewAuthHandler(db)
	if err != nil {
		log.Fatalf("Failed to initialize Auth handler: %v", err)
	}

	podHandler := handlers.NewPodHandler(k8sClient)
	adminHandler := handlers.NewAdminHandler(db)

	router := gin.Default()

	// Serve React Frontend (assuming it gets built to ../web/dist)
	// You might want to serve static files differently in production
	router.Static("/assets", "./web/dist/assets")
	router.LoadHTMLFiles("./web/dist/index.html")
	router.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", nil)
	})

	// API Routes
	api := router.Group("/api")
	{
		// Public Auth routes
		api.GET("/auth/login", authHandler.Login)
		api.GET("/auth/callback", authHandler.Callback)
		api.POST("/auth/logout", authHandler.Logout)
		api.GET("/auth/me", authHandler.Me) // Check current session

		// Protected routes require authentication
		protected := api.Group("/")
		protected.Use(authHandler.AuthMiddleware())
		{
			// Pods
			protected.GET("/pods", podHandler.ListPods)

			// Admin routes require 'admin' role
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
