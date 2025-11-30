package services

import (
	"crypto-wallet/blockchain"
	"crypto-wallet/config"
	"crypto-wallet/db"
	"crypto-wallet/models"
	"log"
	"time"
)

// RunZakatDeduction runs the monthly Zakat deduction for all users
func RunZakatDeduction() error {
	log.Println("🕌 Starting Monthly Zakat Deduction...")

	users, err := db.GetAllUsers()
	if err != nil {
		log.Printf("Error fetching users for Zakat: %v", err)
		return err
	}

	zakatPercentage := config.AppConfig.ZakatPercentage / 100.0 // Convert 2.5 to 0.025
	now := time.Now()
	month := int(now.Month())
	year := now.Year()

	var zakatTransactions []models.Transaction

	for _, user := range users {
		// Get wallet balance
		balance, err := blockchain.GetBalance(user.WalletID)
		if err != nil {
			log.Printf("Error getting balance for wallet %s: %v", user.WalletID, err)
			continue
		}

		// Skip if balance is zero or negative
		if balance <= 0 {
			continue
		}

		// Calculate Zakat amount (2.5%)
		zakatAmount := balance * zakatPercentage

		// Skip if zakat amount is negligible
		if zakatAmount < 0.01 {
			continue
		}

		// Create Zakat transaction
		zakatTx, err := CreateZakatTransaction(user.WalletID, zakatAmount)
		if err != nil {
			log.Printf("Error creating Zakat transaction for wallet %s: %v", user.WalletID, err)
			continue
		}

		zakatTransactions = append(zakatTransactions, *zakatTx)

		// Update wallet's last Zakat date
		err = db.UpdateWalletZakatDate(user.WalletID)
		if err != nil {
			log.Printf("Error updating Zakat date for wallet %s: %v", user.WalletID, err)
		}

		// Log Zakat deduction
		LogZakatDeduction(user.ID, user.WalletID, zakatAmount, balance)

		log.Printf("✅ Zakat deducted from %s: %.2f (Balance: %.2f)", user.WalletID, zakatAmount, balance)
	}

	// If there are Zakat transactions, mine them into a block
	if len(zakatTransactions) > 0 {
		err := MineZakatBlock(zakatTransactions)
		if err != nil {
			log.Printf("Error mining Zakat block: %v", err)
			return err
		}

		// Create Zakat records
		for _, tx := range zakatTransactions {
			user, _ := db.GetUserByWalletID(tx.SenderID)
			balance, _ := blockchain.GetBalance(tx.SenderID)
			
			zakatRecord := models.ZakatRecord{
				UserID:   user.ID,
				WalletID: tx.SenderID,
				Amount:   tx.Amount,
				Balance:  balance,
				TxID:     tx.ID,
				Month:    month,
				Year:     year,
			}

			err := db.CreateZakatRecord(&zakatRecord)
			if err != nil {
				log.Printf("Error creating Zakat record: %v", err)
			}
		}

		log.Printf("🕌 Zakat deduction completed. %d transactions processed.", len(zakatTransactions))
	} else {
		log.Println("🕌 No Zakat deductions required this month.")
	}

	return nil
}

// MineZakatBlock mines a special block containing only Zakat transactions
func MineZakatBlock(transactions []models.Transaction) error {
	// Get last block
	lastBlock, err := db.GetLastBlock()
	if err != nil {
		log.Printf("Error getting last block: %v", err)
		return err
	}

	// Calculate merkle root
	merkleRoot := blockchain.CalculateMerkleRoot(transactions)

	// Create new block
	newBlock := models.Block{
		Index:        lastBlock.Index + 1,
		Timestamp:    time.Now().Unix(),
		Transactions: transactions,
		PrevHash:     lastBlock.Hash,
		Difficulty:   config.AppConfig.POWDifficulty,
		MerkleRoot:   merkleRoot,
		MinedBy:      "system",
	}

	// Run Proof of Work
	log.Printf("⛏️ Mining Zakat block %d...", newBlock.Index)
	blockchain.RunProofOfWork(&newBlock)
	log.Printf("✅ Zakat block %d mined! Hash: %s", newBlock.Index, newBlock.Hash)

	// Insert block into database
	err = db.InsertBlock(&newBlock)
	if err != nil {
		return err
	}

	// Create UTXOs for all outputs in all transactions
	for _, tx := range transactions {
		err := blockchain.CreateUTXOsFromTransaction(tx, newBlock.Index)
		if err != nil {
			log.Printf("Error creating UTXOs for transaction %s: %v", tx.ID, err)
		}

		// Mark inputs as spent
		for _, input := range tx.Vin {
			err := db.MarkUTXOAsSpent(input.TxID, input.Vout, tx.ID)
			if err != nil {
				log.Printf("Error marking UTXO as spent: %v", err)
			}
		}

		// Create transaction logs
		err = CreateTransactionLogs(tx, newBlock.Hash, newBlock.Index, "success")
		if err != nil {
			log.Printf("Error creating transaction logs: %v", err)
		}

		// Recalculate balances
		blockchain.RecalculateBalance(tx.SenderID)
		if tx.ReceiverID != "zakat_pool" {
			blockchain.RecalculateBalance(tx.ReceiverID)
		}
	}

	// Log mining event
	LogMining("system", newBlock.Index, newBlock.Hash, len(transactions))

	return nil
}

// StartZakatScheduler starts the background scheduler for monthly Zakat deductions
func StartZakatScheduler() {
	ticker := time.NewTicker(24 * time.Hour)
	
	log.Println("🕌 Zakat scheduler started")

	for range ticker.C {
		now := time.Now()
		
		// Check if it's the 1st of the month and between 00:00 and 01:00
		if now.Day() == 1 && now.Hour() == 0 {
			err := RunZakatDeduction()
			if err != nil {
				log.Printf("Error running Zakat deduction: %v", err)
				LogSystemEvent("zakat_scheduler_error", "", map[string]interface{}{
					"error": err.Error(),
				}, "error")
			}
		}
	}
}

// ManualZakatDeduction allows manual triggering of Zakat deduction (for testing)
func ManualZakatDeduction() error {
	log.Println("🕌 Manual Zakat deduction triggered")
	return RunZakatDeduction()
}
