package handlers

import (
	"crypto-wallet/blockchain"
	"crypto-wallet/db"
	"crypto-wallet/middleware"
	"crypto-wallet/services"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// GetMonthlyReport returns a monthly summary for authenticated user
func GetMonthlyReport(c *gin.Context) {
	_, walletID, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get transaction logs for the wallet
	logs, err := db.GetTransactionLogsByWallet(walletID, 1000)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transaction logs"})
		return
	}

	// Calculate monthly statistics
	now := time.Now()
	currentMonth := now.Month()
	currentYear := now.Year()

	var totalSent float64
	var totalReceived float64
	var monthlyTxCount int

	for _, log := range logs {
		if log.Timestamp.Month() == currentMonth && log.Timestamp.Year() == currentYear {
			monthlyTxCount++
			if log.Action == "sent" {
				totalSent += -log.Amount // Amount is negative for sent
			} else if log.Action == "received" {
				totalReceived += log.Amount
			}
		}
	}

	// Get Zakat records for current month
	zakatRecords, _ := db.GetZakatRecordsByMonth(int(currentMonth), currentYear)
	var totalZakat float64
	for _, record := range zakatRecords {
		if record.WalletID == walletID {
			totalZakat += record.Amount
		}
	}

	// Get current balance
	balance, _ := blockchain.GetBalance(walletID)

	c.JSON(http.StatusOK, gin.H{
		"wallet_id":       walletID,
		"month":           currentMonth.String(),
		"year":            currentYear,
		"current_balance": balance,
		"total_sent":      totalSent,
		"total_received":  totalReceived,
		"total_zakat":     totalZakat,
		"transaction_count": monthlyTxCount,
		"net_change":      totalReceived - totalSent - totalZakat,
	})
}

// GetZakatReport returns Zakat deduction report for authenticated user
func GetZakatReport(c *gin.Context) {
	_, walletID, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	records, err := db.GetZakatRecordsByWallet(walletID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get zakat records"})
		return
	}

	var totalZakat float64
	var yearlyZakat = make(map[int]float64)

	for _, record := range records {
		totalZakat += record.Amount
		yearlyZakat[record.Year] += record.Amount
	}

	c.JSON(http.StatusOK, gin.H{
		"wallet_id":     walletID,
		"total_zakat":   totalZakat,
		"yearly_zakat":  yearlyZakat,
		"zakat_records": records,
		"count":         len(records),
	})
}

// GetSystemStats returns system-wide statistics (admin)
func GetSystemStats(c *gin.Context) {
	blocks, _ := db.GetAllBlocks()
	users, _ := db.GetAllUsers()
	pendingTxs, _ := db.GetPendingTransactions()
	systemLogs, _ := db.GetSystemLogs(100)

	var totalTransactions int
	var totalVolume float64
	var totalZakat float64

	for _, block := range blocks {
		totalTransactions += len(block.Transactions)
		for _, tx := range block.Transactions {
			totalVolume += tx.Amount
			if tx.IsZakat {
				totalZakat += tx.Amount
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_blocks":        len(blocks),
		"total_users":         len(users),
		"total_transactions":  totalTransactions,
		"pending_transactions": len(pendingTxs),
		"total_volume":        totalVolume,
		"total_zakat_collected": totalZakat,
		"recent_system_logs":  systemLogs,
	})
}

// GetSystemLogs returns system logs (admin)
func GetSystemLogs(c *gin.Context) {
	limit := 100
	if limitParam := c.Query("limit"); limitParam != "" {
		var parsedLimit int
		if _, err := fmt.Sscanf(limitParam, "%d", &parsedLimit); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	logs, err := db.GetSystemLogs(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get system logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"count": len(logs),
	})
}

// TriggerZakatDeduction manually triggers Zakat deduction (admin/testing)
func TriggerZakatDeduction(c *gin.Context) {
	_, _, userID, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	err := services.ManualZakatDeduction()
	if err != nil {
		services.LogSystemEvent("manual_zakat_failed", userID, map[string]interface{}{
			"error": err.Error(),
		}, "error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	services.LogSystemEvent("manual_zakat_triggered", userID, map[string]interface{}{
		"success": true,
	}, "info")

	c.JSON(http.StatusOK, gin.H{
		"message": "Zakat deduction completed successfully",
	})
}

// GetTransactionStats returns transaction statistics for authenticated user
func GetTransactionStats(c *gin.Context) {
	_, walletID, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	logs, err := db.GetTransactionLogsByWallet(walletID, 1000)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transaction logs"})
		return
	}

	var totalSent float64
	var totalReceived float64
	var sentCount int
	var receivedCount int

	for _, log := range logs {
		if log.Action == "sent" {
			totalSent += -log.Amount
			sentCount++
		} else if log.Action == "received" {
			totalReceived += log.Amount
			receivedCount++
		}
	}

	balance, _ := blockchain.GetBalance(walletID)
	zakatRecords, _ := db.GetZakatRecordsByWallet(walletID)
	
	var totalZakat float64
	for _, record := range zakatRecords {
		totalZakat += record.Amount
	}

	c.JSON(http.StatusOK, gin.H{
		"wallet_id":             walletID,
		"current_balance":       balance,
		"total_sent":            totalSent,
		"total_received":        totalReceived,
		"total_zakat_deducted":  totalZakat,
		"sent_count":            sentCount,
		"received_count":        receivedCount,
		"total_transactions":    sentCount + receivedCount,
	})
}
