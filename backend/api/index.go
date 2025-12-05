package handler

import (
	"crypto-wallet/config"
	"crypto-wallet/db"
	"crypto-wallet/handlers"
	"crypto-wallet/middleware"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

var (
	router *gin.Engine
	once   sync.Once
)

func initRouter() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	if err := db.ConnectDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Initialize genesis block if needed
	if err := db.InitializeGenesisBlock(); err != nil {
		log.Fatal("Failed to initialize genesis block:", err)
	}

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode)
	router = gin.Default()

	// Middleware
	router.Use(middleware.CORSMiddleware())

	// Health check
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Public routes
	public := router.Group("/api")
	{
		// Auth routes
		auth := public.Group("/auth")
		{
			auth.POST("/signup", handlers.Signup)
			auth.POST("/verify-otp", handlers.VerifyOTP)
			auth.POST("/login", handlers.Login)
			auth.POST("/resend-otp", handlers.ResendOTP)
		}

		// Blockchain public routes
		blockchain := public.Group("/blockchain")
		{
			blockchain.GET("/chain", handlers.GetBlockchain)
			blockchain.GET("/block/:index", handlers.GetBlockByIndex)
			blockchain.GET("/validate", handlers.ValidateBlockchain)
			blockchain.GET("/stats", handlers.GetBlockchainStats)
		}
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		// User routes
		user := protected.Group("/user")
		{
			user.GET("/profile", handlers.GetProfile)
			user.PUT("/profile", handlers.UpdateProfile)
		}

		// Wallet routes
		wallet := protected.Group("/wallet")
		{
			wallet.GET("/balance", handlers.GetMyBalance)
			wallet.GET("/info", handlers.GetMyWalletInfo)
			wallet.GET("/utxos", handlers.GetMyUTXOs)
		}

		// Transaction routes
		transaction := protected.Group("/transaction")
		{
			transaction.POST("/send", handlers.SendMoney)
			transaction.GET("/history", handlers.GetTransactionHistory)
			transaction.GET("/pending", handlers.GetPendingTransactions)
		}

		// Blockchain protected routes
		blockchain := protected.Group("/blockchain")
		{
			blockchain.POST("/mine", handlers.MineBlock)
			blockchain.GET("/latest", handlers.GetLatestBlock)
		}

		// Reports routes
		reports := protected.Group("/reports")
		{
			reports.GET("/monthly", handlers.GetMonthlyReport)
			reports.GET("/zakat", handlers.GetZakatReport)
			reports.GET("/stats", handlers.GetTransactionStats)
		}

		// System routes
		system := protected.Group("/system")
		{
			system.GET("/logs", handlers.GetSystemLogs)
		}
	}
}

// Handler is the serverless function entry point
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initRouter)
	router.ServeHTTP(w, r)
}
