package services

import (
	"crypto-wallet/db"
	"crypto-wallet/models"
	"log"
)

// LogSystemEvent logs a system event to the database
func LogSystemEvent(event string, userID string, details map[string]interface{}, severity string) {
	systemLog := models.SystemLog{
		Event:    event,
		UserID:   userID,
		Details:  details,
		Severity: severity,
	}

	err := db.CreateSystemLog(&systemLog)
	if err != nil {
		log.Printf("Failed to create system log: %v", err)
	}
}

// LogSystemEventWithIP logs a system event with IP address
func LogSystemEventWithIP(event string, userID string, ipAddress string, details map[string]interface{}, severity string) {
	systemLog := models.SystemLog{
		Event:     event,
		UserID:    userID,
		IPAddress: ipAddress,
		Details:   details,
		Severity:  severity,
	}

	err := db.CreateSystemLog(&systemLog)
	if err != nil {
		log.Printf("Failed to create system log: %v", err)
	}
}

// LogTransactionEvent logs a transaction event
func LogTransactionEvent(userID, walletID, txID, action string, amount float64, counterparty, blockHash string, blockIndex int, status, note string) {
	txLog := models.TransactionLog{
		UserID:       userID,
		WalletID:     walletID,
		TxID:         txID,
		Action:       action,
		Amount:       amount,
		Counterparty: counterparty,
		BlockHash:    blockHash,
		BlockIndex:   blockIndex,
		Status:       status,
		Note:         note,
	}

	err := db.CreateTransactionLog(&txLog)
	if err != nil {
		log.Printf("Failed to create transaction log: %v", err)
	}
}

// LogLogin logs a successful login
func LogLogin(userID, email, ipAddress string) {
	LogSystemEventWithIP("login", userID, ipAddress, map[string]interface{}{
		"email": email,
	}, "info")
}

// LogFailedLogin logs a failed login attempt
func LogFailedLogin(email, ipAddress, reason string) {
	LogSystemEventWithIP("failed_login", "", ipAddress, map[string]interface{}{
		"email":  email,
		"reason": reason,
	}, "warning")
}

// LogSignup logs a new user signup
func LogSignup(userID, email, ipAddress string) {
	LogSystemEventWithIP("signup", userID, ipAddress, map[string]interface{}{
		"email": email,
	}, "info")
}

// LogOTPGenerated logs OTP generation
func LogOTPGenerated(email, ipAddress string) {
	LogSystemEventWithIP("otp_generated", "", ipAddress, map[string]interface{}{
		"email": email,
	}, "info")
}

// LogOTPVerified logs successful OTP verification
func LogOTPVerified(userID, email, ipAddress string) {
	LogSystemEventWithIP("otp_verified", userID, ipAddress, map[string]interface{}{
		"email": email,
	}, "info")
}

// LogFailedOTP logs failed OTP verification
func LogFailedOTP(email, ipAddress string) {
	LogSystemEventWithIP("failed_otp", "", ipAddress, map[string]interface{}{
		"email": email,
	}, "warning")
}

// LogMining logs a mining event
func LogMining(minerWalletID string, blockIndex int, blockHash string, txCount int) {
	LogSystemEvent("mining", "", map[string]interface{}{
		"miner":       minerWalletID,
		"block_index": blockIndex,
		"block_hash":  blockHash,
		"tx_count":    txCount,
	}, "info")
}

// LogZakatDeduction logs a zakat deduction event
func LogZakatDeduction(userID, walletID string, amount, balance float64) {
	LogSystemEvent("zakat_deduction", userID, map[string]interface{}{
		"wallet_id": walletID,
		"amount":    amount,
		"balance":   balance,
	}, "info")
}
