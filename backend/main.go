package main

import (
	"bufio"
	"context"
	"log"
	"os"
	"strings"
	"time"

	"k-view/handlers"
	"k-view/k8s"
	_ "k-view/docs"

	"github.com/gin-gonic/gin"
	"github.com/hellofresh/health-go/v5"
	"github.com/sirupsen/logrus"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func loadEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
			os.Setenv(key, value)
		}
	}
}

// @title K-View API
// @version 1.0
// @description Modern, lightweight Kubernetes dashboard API.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://github.com/oisis/k-view
// @contact.email support@k-view.local

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /
// @query.collection.format multi

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type 'Bearer ' followed by your token.

func main() {
	// Configure global logger
	logrus.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
	logrus.SetOutput(os.Stdout)
	if os.Getenv("KVIEW_DEBUG") == "true" {
		logrus.SetLevel(logrus.DebugLevel)
	} else {
		logrus.SetLevel(logrus.InfoLevel)
	}

	loadEnv(".env")

	devMode := os.Getenv("DEV_MODE") == "true"
	if devMode {
		log.Println("⚠️  DEVELOPMENT MODE ENABLED — Do not use in production!")
	}

	// Stateless execution natively requires no DB init.

	// Initialize Kubernetes Provider (Real Client only)
	k8sProvider, err := k8s.NewClient()
	if err != nil {
		log.Fatalf("Failed to initialize Kubernetes client: %v", err)
	}

	// Initialize Auth Handler
	authHandler, err := handlers.NewAuthHandler()
	if err != nil {
		log.Fatalf("Failed to initialize Auth handler: %v", err)
	}

	podHandler := handlers.NewPodHandler(k8sProvider)
	nodeHandler := handlers.NewNodeHandler(k8sProvider)
	consoleHandler := handlers.NewConsoleHandler(devMode)
	resourceHandler := handlers.NewResourceHandler(devMode, k8sProvider)
	rbacHandler := handlers.NewRBACHandler(devMode, authHandler.GetRBACConfig(), k8sProvider)
	networkHandler := handlers.NewNetworkHandler(k8sProvider)
	execHandler := handlers.NewExecHandler(k8sProvider)

	router := gin.Default()

	// Global Security Headers
	router.Use(handlers.SecurityHeadersMiddleware())

	// Health check endpoints
	h, _ := health.New()
	// Basic Liveness
	router.GET("/healthz", gin.WrapH(h.Handler()))

	// Readiness with K8s API check
	r, _ := health.New(health.WithComponent(health.Component{
		Name:    "k8s-api",
		Version: "v1",
	}), health.WithChecks(health.Config{
		Name:      "k8s-connectivity",
		Timeout:   time.Second * 5,
		SkipOnErr: false,
		Check: func(ctx context.Context) error {
			// Simple check: list namespaces to verify connectivity
			_, err := k8sProvider.ListNamespaces(ctx)
			return err
		},
	}))
	router.GET("/readyz", gin.WrapH(r.Handler()))

	// Serve static frontend assets from embedded FS (Single Binary mode)
	router.Use(handlers.ServeStatic())

	// API Routes
	api := router.Group("/api")
	api.Use(handlers.RateLimitMiddleware(100, time.Minute))
	{
		// Swagger documentation
		api.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

		// Public Auth routes
		authGroup := api.Group("/auth")
		authGroup.Use(handlers.RateLimitMiddleware(10, time.Minute))
		{
			authGroup.GET("/login", authHandler.Login)           // OIDC initiation
			authGroup.POST("/login", authHandler.LocalLogin)     // Local credential POST
			authGroup.GET("/providers", authHandler.GetProviders) // Get available auth methods
			authGroup.GET("/callback", authHandler.Callback)
			authGroup.POST("/logout", authHandler.Logout)
		}

		// Dev-mode only: bypass SSO login
		if devMode {
			api.POST("/auth/dev-login", authHandler.DevLogin)
		}

		api.GET("/version", func(c *gin.Context) {
			version := os.Getenv("APP_VERSION")
			if version == "" {
				version = "unknown"
			}
			c.JSON(200, gin.H{"version": version})
		})

		// Protected routes — require a valid auth token
		protected := api.Group("/")
		protected.Use(authHandler.AuthMiddleware())
		protected.Use(authHandler.AuditMiddleware())
		{
			// /auth/me needs to be here so AuthMiddleware populates the email context
			protected.GET("/auth/me", authHandler.Me)
			protected.GET("/auth/details", rbacHandler.GetMyDetails)
			protected.GET("/pods", podHandler.ListPods)
			protected.GET("/namespaces", podHandler.ListNamespaces)
			protected.GET("/nodes", nodeHandler.ListNodes)
			protected.POST("/console/exec", consoleHandler.Exec)
			protected.GET("/cluster/events", resourceHandler.GetClusterEvents)
			protected.GET("/search", resourceHandler.Search)
			protected.GET("/resources/:kind", resourceHandler.List)
			protected.GET("/cluster/stats", resourceHandler.GetStats)
			protected.POST("/resources/:kind", resourceHandler.Create)
			protected.POST("/resources/:kind/:namespace", resourceHandler.Create)
			protected.GET("/resources/:kind/:namespace/:name", resourceHandler.GetDetails)
			protected.GET("/resources/:kind/:namespace/:name/yaml", resourceHandler.GetYAML)
			protected.GET("/resources/:kind/:namespace/:name/topology", resourceHandler.GetTopology)
			protected.PUT("/resources/:kind/:namespace/:name/yaml", resourceHandler.UpdateYAML)
			protected.PUT("/resources/:kind/:namespace/:name/restart", resourceHandler.Restart)
			protected.PUT("/resources/:kind/:namespace/:name/scale", resourceHandler.Scale)
			protected.POST("/resources/:kind/:namespace/:name/trigger", resourceHandler.Trigger)
			protected.DELETE("/resources/:kind/:namespace/:name", resourceHandler.Delete)
			protected.GET("/resources/:kind/:namespace/:name/logs", podHandler.GetLogs)
			protected.GET("/resources/:kind/:namespace/:name/events", resourceHandler.GetEvents)
			protected.GET("/network/trace/:type/:namespace/:name", networkHandler.Trace)
			protected.GET("/exec/:namespace/:name/:container", execHandler.HandleExec)
			admin := protected.Group("/rbac")
			admin.Use(authHandler.AdminMiddleware())
			{
			        admin.GET("/status", rbacHandler.GetStatus)
			        admin.GET("/roles", rbacHandler.ListRoles)
			        admin.GET("/audit", rbacHandler.GetAuditLogs)
			}

		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	logrus.WithField("port", port).Info("Starting K-View server")
	router.Run(":" + port)
}
