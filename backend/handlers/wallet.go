package handlers

import (
	"crypto-wallet/blockchain"
	"crypto-wallet/db"
	"crypto-wallet/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetWalletBalance returns the balance for a wallet
func GetWalletBalance(c *gin.Context) {
	walletID := c.Param("walletId")

	// Validate wallet exists
	if !db.WalletExists(walletID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid wallet ID"})
		return
	}

	// Calculate balance from UTXOs
	balance, err := blockchain.GetBalance(walletID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get balance"})
		return
	}

	// Update cached balance
	db.UpdateWalletBalance(walletID, balance)

	c.JSON(http.StatusOK, gin.H{
		"wallet_id": walletID,
		"balance":   balance,
	})
}

// GetMyBalance returns the authenticated user's balance
func GetMyBalance(c *gin.Context) {
	_, walletID, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	balance, err := blockchain.GetBalance(walletID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get balance"})
		return
	}

	// Update cached balance
	db.UpdateWalletBalance(walletID, balance)

	c.JSON(http.StatusOK, gin.H{
		"wallet_id": walletID,
		"balance":   balance,
	})
}

// GetWalletInfo returns detailed wallet information
func GetWalletInfo(c *gin.Context) {
	walletID := c.Param("walletId")

	// Validate wallet exists
	wallet, err := db.GetWallet(walletID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}

	// Get user info
	user, err := db.GetUserByWalletID(walletID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get current balance
	balance, _ := blockchain.GetBalance(walletID)

	// Get UTXOs
	utxos, _ := blockchain.FindUTXOs(walletID)

	c.JSON(http.StatusOK, gin.H{
		"wallet_id":       walletID,
		"user_name":       user.FullName,
		"public_key":      wallet.PublicKey,
		"balance":         balance,
		"utxo_count":      len(utxos),
		"last_zakat_date": wallet.LastZakatDate,
		"created_at":      wallet.CreatedAt,
	})
}

// GetMyWalletInfo returns detailed info for authenticated user's wallet
func GetMyWalletInfo(c *gin.Context) {
	_, walletID, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	wallet, err := db.GetWallet(walletID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}

	user, err := db.GetUserByWalletID(walletID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	balance, _ := blockchain.GetBalance(walletID)
	utxos, _ := blockchain.FindUTXOs(walletID)

	c.JSON(http.StatusOK, gin.H{
		"wallet_id":       walletID,
		"user_name":       user.FullName,
		"email":           user.Email,
		"public_key":      wallet.PublicKey,
		"balance":         balance,
		"utxo_count":      len(utxos),
		"last_zakat_date": wallet.LastZakatDate,
		"beneficiaries":   user.Beneficiaries,
		"created_at":      wallet.CreatedAt,
	})
}

// GetMyUTXOs returns all unspent UTXOs for authenticated user
func GetMyUTXOs(c *gin.Context) {
	_, walletID, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	utxos, err := blockchain.FindUTXOs(walletID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get UTXOs"})
		return
	}

	var totalBalance float64
	for _, utxo := range utxos {
		if !utxo.IsSpent {
			totalBalance += utxo.Amount
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"wallet_id":     walletID,
		"utxos":         utxos,
		"utxo_count":    len(utxos),
		"total_balance": totalBalance,
	})
}

// GetBeneficiaries returns the list of beneficiaries for authenticated user
func GetBeneficiaries(c *gin.Context) {
	email, _, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := db.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get details for each beneficiary
	var beneficiaryDetails []gin.H
	for _, walletID := range user.Beneficiaries {
		beneficiary, err := db.GetUserByWalletID(walletID)
		if err != nil {
			continue
		}

		beneficiaryDetails = append(beneficiaryDetails, gin.H{
			"wallet_id": walletID,
			"full_name": beneficiary.FullName,
			"email":     beneficiary.Email,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"beneficiaries": beneficiaryDetails,
		"count":         len(beneficiaryDetails),
	})
}

// ValidateWalletID checks if a wallet ID exists
func ValidateWalletID(c *gin.Context) {
	walletID := c.Param("walletId")

	exists := db.WalletExists(walletID)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"valid":   false,
			"message": "Wallet ID does not exist",
		})
		return
	}

	// Get user info
	user, err := db.GetUserByWalletID(walletID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"valid": true,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":     true,
		"wallet_id": walletID,
		"user_name": user.FullName,
	})
}
