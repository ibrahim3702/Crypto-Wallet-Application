package main

import (
	"crypto-wallet/config"
	"crypto-wallet/db"
	"crypto-wallet/handlers"
	"crypto-wallet/middleware"
	"crypto-wallet/services"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	log.Println("🚀 Starting Crypto Wallet Backend...")
	config.LoadConfig()

	// Connect to database
	if err := db.ConnectDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.DisconnectDB()

	// Initialize genesis block if needed
	if err := db.InitializeGenesisBlock(); err != nil {
		log.Fatal("Failed to initialize genesis block:", err)
	}

	// Start Zakat scheduler in background
	go services.StartZakatScheduler()

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode) // Change to gin.DebugMode for development
	r := gin.Default()

	// Apply CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "Crypto Wallet API",
			"version": "1.0.0",
		})
	})

	// Public routes (no authentication required)
	public := r.Group("/api")
	{
		// Authentication routes
		auth := public.Group("/auth")
		{
			auth.POST("/signup", handlers.Signup)
			auth.POST("/login", handlers.Login)
			auth.POST("/verify-otp", handlers.VerifyOTP)
			auth.POST("/resend-otp", handlers.ResendOTP)
		}

		// Public blockchain routes
		blockchain := public.Group("/blockchain")
		{
			blockchain.GET("/chain", handlers.GetBlockchain)
			blockchain.GET("/block/:index", handlers.GetBlockByIndex)
			blockchain.GET("/latest", handlers.GetLatestBlock)
			blockchain.GET("/validate", handlers.ValidateBlockchain)
			blockchain.GET("/stats", handlers.GetBlockchainStats)
		}

		// Public wallet validation
		public.GET("/wallet/validate/:walletId", handlers.ValidateWalletID)
		public.GET("/wallet/balance/:walletId", handlers.GetWalletBalance)
		public.GET("/wallet/info/:walletId", handlers.GetWalletInfo)

		// Public transaction lookup
		public.GET("/transaction/:txId", handlers.GetTransactionByID)
		public.GET("/transactions/pending", handlers.GetPendingTransactions)
	}

	// Protected routes (authentication required)
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		// User profile routes
		user := protected.Group("/user")
		{
			user.GET("/profile", handlers.GetProfile)
			user.PUT("/profile", handlers.UpdateProfile)
			user.GET("/private-key", handlers.GetPrivateKey)
		}

		// Wallet routes
		wallet := protected.Group("/wallet")
		{
			wallet.GET("/my-balance", handlers.GetMyBalance)
			wallet.GET("/my-info", handlers.GetMyWalletInfo)
			wallet.GET("/my-utxos", handlers.GetMyUTXOs)
			wallet.GET("/beneficiaries", handlers.GetBeneficiaries)
			wallet.POST("/beneficiary", handlers.AddBeneficiary)
			wallet.DELETE("/beneficiary/:walletId", handlers.RemoveBeneficiary)
		}

		// Transaction routes
		transaction := protected.Group("/transaction")
		{
			transaction.POST("/send", handlers.SendMoney)
			transaction.GET("/history", handlers.GetTransactionHistory)
			transaction.GET("/my-pending", handlers.GetMyPendingTransactions)
			transaction.GET("/zakat-history", handlers.GetZakatHistory)
		}

		// Mining routes
		mining := protected.Group("/mining")
		{
			mining.POST("/mine", handlers.MineBlock)
		}

		// Reports routes
		reports := protected.Group("/reports")
		{
			reports.GET("/monthly", handlers.GetMonthlyReport)
			reports.GET("/zakat", handlers.GetZakatReport)
			reports.GET("/stats", handlers.GetTransactionStats)
		}

		// Admin routes (system-wide operations)
		admin := protected.Group("/admin")
		{
			admin.GET("/system-stats", handlers.GetSystemStats)
			admin.GET("/system-logs", handlers.GetSystemLogs)
			admin.POST("/trigger-zakat", handlers.TriggerZakatDeduction)
		}
	}

	// Start server
	port := config.AppConfig.Port
	log.Printf("✅ Server running on http://localhost:%s", port)
	log.Printf("📚 API Documentation available at http://localhost:%s/api", port)
	log.Println("🔐 Authentication: JWT-based with OTP verification")
	log.Println("⛏️  Mining: Use POST /api/mining/mine (requires authentication)")
	log.Println("🕌 Zakat: Automatically deducted monthly at 2.5%")
	
	if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}