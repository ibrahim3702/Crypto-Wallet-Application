package handlers

import (
	"crypto-wallet/db"
	"crypto-wallet/middleware"
	"crypto-wallet/models"
	"crypto-wallet/services"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// SendMoney creates and adds a transaction to pending pool
func SendMoney(c *gin.Context) {
	_, senderWalletID, userID, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.SendMoneyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := middleware.GetClientIP(c)

	// Prevent sending to self
	if req.ReceiverWalletID == senderWalletID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot send money to yourself"})
		return
	}

	// Create transaction
	transaction, err := services.CreateTransaction(
		senderWalletID,
		req.ReceiverWalletID,
		req.Amount,
		req.Note,
		req.PrivateKey,
	)
	if err != nil {
		services.LogSystemEventWithIP("transaction_failed", userID, ipAddress, map[string]interface{}{
			"receiver": req.ReceiverWalletID,
			"amount":   req.Amount,
			"error":    err.Error(),
		}, "error")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	services.LogSystemEventWithIP("transaction_pending", userID, ipAddress, map[string]interface{}{
		"tx_id":    transaction.ID,
		"receiver": req.ReceiverWalletID,
		"amount":   req.Amount,
	}, "info")

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Transaction created and added to pending pool",
		"tx_id":        transaction.ID,
		"amount":       req.Amount,
		"receiver":     req.ReceiverWalletID,
		"status":       "pending",
		"note":         "Transaction will be processed when the next block is mined",
	})
}

// GetTransactionHistory returns transaction history for authenticated user
func GetTransactionHistory(c *gin.Context) {
	_, walletID, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get limit from query param (default 50)
	limit := 50
	if limitParam := c.Query("limit"); limitParam != "" {
		var parsedLimit int
		if _, err := fmt.Sscanf(limitParam, "%d", &parsedLimit); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	logs, err := db.GetTransactionLogsByWallet(walletID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transaction history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"wallet_id":    walletID,
		"transactions": logs,
		"count":        len(logs),
	})
}

// GetPendingTransactions returns all pending transactions
func GetPendingTransactions(c *gin.Context) {
	pendingTxs, err := db.GetPendingTransactions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_transactions": pendingTxs,
		"count":                len(pendingTxs),
	})
}

// GetTransactionByID returns details of a specific transaction
func GetTransactionByID(c *gin.Context) {
	txID := c.Param("txId")

	// Search in blocks
	blocks, err := db.GetAllBlocks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search transaction"})
		return
	}

	for _, block := range blocks {
		for _, tx := range block.Transactions {
			if tx.ID == txID {
				c.JSON(http.StatusOK, gin.H{
					"transaction": tx,
					"block_index": block.Index,
					"block_hash":  block.Hash,
					"status":      "mined",
				})
				return
			}
		}
	}

	// Check pending transactions
	pendingTxs, _ := db.GetPendingTransactions()
	for _, ptx := range pendingTxs {
		if ptx.Transaction.ID == txID {
			c.JSON(http.StatusOK, gin.H{
				"transaction": ptx.Transaction,
				"status":      ptx.Status,
			})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
}

// GetMyPendingTransactions returns pending transactions for authenticated user
func GetMyPendingTransactions(c *gin.Context) {
	_, walletID, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	pendingTxs, err := db.GetPendingTransactions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending transactions"})
		return
	}

	// Filter for user's transactions
	var myPendingTxs []models.PendingTransaction
	for _, ptx := range pendingTxs {
		if ptx.Transaction.SenderID == walletID || ptx.Transaction.ReceiverID == walletID {
			myPendingTxs = append(myPendingTxs, ptx)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_transactions": myPendingTxs,
		"count":                len(myPendingTxs),
	})
}

// GetZakatHistory returns zakat deduction history for authenticated user
func GetZakatHistory(c *gin.Context) {
	_, walletID, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	records, err := db.GetZakatRecordsByWallet(walletID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get zakat history"})
		return
	}

	var totalZakat float64
	for _, record := range records {
		totalZakat += record.Amount
	}

	c.JSON(http.StatusOK, gin.H{
		"wallet_id":     walletID,
		"zakat_records": records,
		"count":         len(records),
		"total_zakat":   totalZakat,
	})
}
