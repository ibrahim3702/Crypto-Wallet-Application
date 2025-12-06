package middleware

import (
	"crypto-wallet/auth"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT token from Authorization header
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := auth.ValidateJWT(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Set claims in context
		c.Set("email", claims.Email)
		c.Set("wallet_id", claims.WalletID)
		c.Set("user_id", claims.UserID)

		c.Next()
	}
}

// CORSMiddleware handles CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// GetUserContext retrieves user information from context
func GetUserContext(c *gin.Context) (email, walletID, userID string, exists bool) {
	emailVal, emailExists := c.Get("email")
	walletVal, walletExists := c.Get("wallet_id")
	userVal, userExists := c.Get("user_id")

	if !emailExists || !walletExists || !userExists {
		return "", "", "", false
	}

	return emailVal.(string), walletVal.(string), userVal.(string), true
}

// GetClientIP retrieves the client IP address
func GetClientIP(c *gin.Context) string {
	// Check X-Forwarded-For header first (for proxies)
	forwarded := c.GetHeader("X-Forwarded-For")
	if forwarded != "" {
		// Get the first IP if multiple are present
		ips := strings.Split(forwarded, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	realIP := c.GetHeader("X-Real-IP")
	if realIP != "" {
		return realIP
	}

	// Fall back to RemoteAddr
	return c.ClientIP()
}
