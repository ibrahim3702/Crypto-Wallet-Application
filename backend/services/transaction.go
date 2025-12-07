package services

import (
	"crypto-wallet/blockchain"
	"crypto-wallet/crypto"
	"crypto-wallet/db"
	"crypto-wallet/models"
	"errors"
	"fmt"
	"time"

	"crypto/sha256"
	"encoding/hex"
)

// CreateTransaction creates a new transaction with digital signature verification
func CreateTransaction(senderWalletID, receiverWalletID string, amount float64, note string, privateKeyStr string) (*models.Transaction, error) {
	// Validate sender wallet exists
	sender, err := db.GetUserByWalletID(senderWalletID)
	if err != nil {
		LogSystemEvent("invalid_wallet", "", map[string]interface{}{
			"wallet_id": senderWalletID,
			"error":     "sender wallet not found",
		}, "error")
		return nil, errors.New("sender wallet not found")
	}

	// Validate receiver wallet exists
	if err := db.ValidateWalletExists(receiverWalletID); err != nil {
		LogSystemEvent("invalid_wallet", sender.ID, map[string]interface{}{
			"wallet_id": receiverWalletID,
			"error":     "receiver wallet not found",
		}, "error")
		return nil, errors.New("receiver wallet not found")
	}

	// Check if amount is positive
	if amount <= 0 {
		return nil, errors.New("amount must be positive")
	}

	// Select UTXOs to cover the amount
	selectedUTXOs, change, err := blockchain.SelectUTXOs(senderWalletID, amount)
	if err != nil {
		LogSystemEvent("insufficient_balance", sender.ID, map[string]interface{}{
			"wallet_id": senderWalletID,
			"amount":    amount,
			"error":     err.Error(),
		}, "warning")
		return nil, err
	}

	// Create transaction inputs from selected UTXOs
	var inputs []models.TXInput
	timestamp := time.Now().Unix()

	// Create signature data
	signatureData := crypto.CreateTransactionSignatureData(
		senderWalletID,
		receiverWalletID,
		amount,
		timestamp,
		note,
	)

	// Sign the transaction
	signature, err := crypto.SignData(signatureData, privateKeyStr)
	if err != nil {
		LogSystemEvent("signature_failure", sender.ID, map[string]interface{}{
			"error": err.Error(),
		}, "error")
		return nil, errors.New("failed to sign transaction")
	}

	// Verify signature with public key
	err = crypto.VerifySignature(signatureData, signature, sender.PublicKey)
	if err != nil {
		LogSystemEvent("signature_verification_failed", sender.ID, map[string]interface{}{
			"error": err.Error(),
		}, "error")
		return nil, errors.New("signature verification failed")
	}

	// Double-spend prevention: Validate all UTXOs are not spent
	for _, utxo := range selectedUTXOs {
		if err := blockchain.ValidateUTXONotSpent(utxo.TxID, utxo.Vout); err != nil {
			LogSystemEvent("double_spend_attempt", sender.ID, map[string]interface{}{
				"tx_id": utxo.TxID,
				"vout":  utxo.Vout,
				"error": err.Error(),
			}, "error")
			return nil, err
		}
	}

	// Create inputs
	for _, utxo := range selectedUTXOs {
		input := models.TXInput{
			TxID:      utxo.TxID,
			Vout:      utxo.Vout,
			Signature: signature,
			PubKey:    sender.PublicKey,
		}
		inputs = append(inputs, input)
	}

	// Create outputs
	var outputs []models.TXOutput

	// Output to receiver
	outputs = append(outputs, models.TXOutput{
		Value:      amount,
		PubKeyHash: receiverWalletID,
		IsSpent:    false,
	})

	// Change output back to sender (if any)
	if change > 0 {
		outputs = append(outputs, models.TXOutput{
			Value:      change,
			PubKeyHash: senderWalletID,
			IsSpent:    false,
		})
	}

	// Create transaction ID
	txID := generateTransactionID(senderWalletID, receiverWalletID, amount, timestamp)

	transaction := &models.Transaction{
		ID:         txID,
		Vin:        inputs,
		Vout:       outputs,
		Timestamp:  timestamp,
		SenderID:   senderWalletID,
		ReceiverID: receiverWalletID,
		Amount:     amount,
		Note:       note,
		IsZakat:    false,
		Type:       "transfer",
	}

	// Add to pending transactions
	pendingTx := &models.PendingTransaction{
		ID:          txID,
		Transaction: *transaction,
	}

	err = db.AddPendingTransaction(pendingTx)
	if err != nil {
		return nil, err
	}

	// Lock the UTXOs to prevent double-spending in other pending transactions
	err = blockchain.LockUTXOs(selectedUTXOs, txID)
	if err != nil {
		// If locking fails, remove the pending transaction
		db.DeletePendingTransaction(txID)
		LogSystemEvent("utxo_lock_failed", sender.ID, map[string]interface{}{
			"tx_id": txID,
			"error": err.Error(),
		}, "error")
		return nil, errors.New("failed to lock UTXOs: " + err.Error())
	}

	// Log the transaction
	LogSystemEvent("transaction_created", sender.ID, map[string]interface{}{
		"tx_id":    txID,
		"amount":   amount,
		"receiver": receiverWalletID,
	}, "info")

	return transaction, nil
}

// CreateZakatTransaction creates a Zakat deduction transaction
func CreateZakatTransaction(walletID string, amount float64) (*models.Transaction, error) {
	user, err := db.GetUserByWalletID(walletID)
	if err != nil {
		return nil, errors.New("wallet not found")
	}

	timestamp := time.Now().Unix()
	txID := generateTransactionID(walletID, "zakat_pool", amount, timestamp)

	// For Zakat, we create a simplified transaction without inputs
	// In a real system, you'd still select UTXOs
	transaction := &models.Transaction{
		ID:         txID,
		Vin:        []models.TXInput{},
		Vout:       []models.TXOutput{},
		Timestamp:  timestamp,
		SenderID:   walletID,
		ReceiverID: "zakat_pool",
		Amount:     amount,
		Note:       "Monthly Zakat Deduction (2.5%)",
		IsZakat:    true,
		Type:       "zakat_deduction",
	}

	LogSystemEvent("zakat_deduction", user.ID, map[string]interface{}{
		"tx_id":     txID,
		"amount":    amount,
		"wallet_id": walletID,
	}, "info")

	return transaction, nil
}

// VerifyTransactionSignature verifies the digital signature of a transaction
func VerifyTransactionSignature(tx models.Transaction) error {
	if len(tx.Vin) == 0 {
		// Zakat or genesis transactions might not have inputs
		return nil
	}

	// Get the first input's public key
	pubKey := tx.Vin[0].PubKey
	signature := tx.Vin[0].Signature

	// Recreate signature data
	signatureData := crypto.CreateTransactionSignatureData(
		tx.SenderID,
		tx.ReceiverID,
		tx.Amount,
		tx.Timestamp,
		tx.Note,
	)

	// Verify signature
	err := crypto.VerifySignature(signatureData, signature, pubKey)
	if err != nil {
		return errors.New("invalid transaction signature")
	}

	return nil
}

// ProcessTransaction validates and processes a transaction
func ProcessTransaction(tx models.Transaction) error {
	// Verify signature
	if err := VerifyTransactionSignature(tx); err != nil {
		LogSystemEvent("transaction_validation_failed", "", map[string]interface{}{
			"tx_id": tx.ID,
			"error": "signature verification failed",
		}, "error")
		return err
	}

	// Validate sender has sufficient balance
	balance, err := blockchain.GetBalance(tx.SenderID)
	if err != nil {
		return err
	}

	if balance < tx.Amount {
		return errors.New("insufficient balance")
	}

	// Double-spend check
	for _, input := range tx.Vin {
		if err := blockchain.ValidateUTXONotSpent(input.TxID, input.Vout); err != nil {
			return err
		}
	}

	return nil
}

// generateTransactionID generates a unique transaction ID
func generateTransactionID(senderID, receiverID string, amount float64, timestamp int64) string {
	data := fmt.Sprintf("%s%s%.8f%d", senderID, receiverID, amount, timestamp)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// CreateTransactionLogs creates transaction logs for sender and receiver
func CreateTransactionLogs(tx models.Transaction, blockHash string, blockIndex int, status string) error {
	// Log for sender
	senderLog := models.TransactionLog{
		WalletID:     tx.SenderID,
		TxID:         tx.ID,
		Action:       "sent",
		Amount:       -tx.Amount,
		Counterparty: tx.ReceiverID,
		BlockHash:    blockHash,
		BlockIndex:   blockIndex,
		Status:       status,
		Note:         tx.Note,
	}
	
	sender, err := db.GetUserByWalletID(tx.SenderID)
	if err == nil {
		senderLog.UserID = sender.ID
	}
	
	if err := db.CreateTransactionLog(&senderLog); err != nil {
		return err
	}

	// Log for receiver (skip for zakat pool)
	if tx.ReceiverID != "zakat_pool" {
		receiverLog := models.TransactionLog{
			WalletID:     tx.ReceiverID,
			TxID:         tx.ID,
			Action:       "received",
			Amount:       tx.Amount,
			Counterparty: tx.SenderID,
			BlockHash:    blockHash,
			BlockIndex:   blockIndex,
			Status:       status,
			Note:         tx.Note,
		}
		
		receiver, err := db.GetUserByWalletID(tx.ReceiverID)
		if err == nil {
			receiverLog.UserID = receiver.ID
		}
		
		if err := db.CreateTransactionLog(&receiverLog); err != nil {
			return err
		}
	}

	return nil
}

// RecalculateUserBalance recalculates a user's balance based on their UTXOs
func RecalculateUserBalance(walletID string) error {
	user, err := db.GetUserByWalletID(walletID)
	if err != nil {
		return err
	}

	// Get all unspent UTXOs for this wallet
	utxos, err := db.GetUTXOsByWalletID(walletID)
	if err != nil {
		return err
	}

	// Calculate total balance
	var balance float64
	for _, utxo := range utxos {
		if !utxo.IsSpent {
			balance += utxo.Amount
		}
	}

	// Update user's balance
	return db.UpdateUserBalance(user.ID, balance)
}
