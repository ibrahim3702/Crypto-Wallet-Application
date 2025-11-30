package handlers

import (
	"crypto-wallet/blockchain"
	"crypto-wallet/config"
	"crypto-wallet/db"
	"crypto-wallet/middleware"
	"crypto-wallet/models"
	"crypto-wallet/services"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// GetBlockchain returns the entire blockchain
func GetBlockchain(c *gin.Context) {
	blocks, err := db.GetAllBlocks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get blockchain"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"blockchain": blocks,
		"length":     len(blocks),
	})
}

// GetBlockByIndex returns a specific block by its index
func GetBlockByIndex(c *gin.Context) {
	var index int
	if _, err := fmt.Sscanf(c.Param("index"), "%d", &index); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid block index"})
		return
	}

	block, err := db.GetBlockByIndex(index)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Block not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"block": block})
}

// GetLatestBlock returns the most recent block
func GetLatestBlock(c *gin.Context) {
	block, err := db.GetLastBlock()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get latest block"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"block": block})
}

// MineBlock mines pending transactions into a new block
func MineBlock(c *gin.Context) {
	_, walletID, userID, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get pending transactions
	pendingTxs, err := db.GetPendingTransactions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending transactions"})
		return
	}

	if len(pendingTxs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No pending transactions to mine"})
		return
	}

	// Extract transactions
	var transactions []models.Transaction
	for _, ptx := range pendingTxs {
		// Validate transaction
		if err := services.ProcessTransaction(ptx.Transaction); err != nil {
			services.LogSystemEvent("transaction_validation_failed", userID, map[string]interface{}{
				"tx_id": ptx.Transaction.ID,
				"error": err.Error(),
			}, "error")
			// Mark as failed and continue
			db.UpdatePendingTransactionStatus(ptx.ID, "failed")
			continue
		}
		transactions = append(transactions, ptx.Transaction)
	}

	if len(transactions) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid transactions to mine"})
		return
	}

	// Get last block
	lastBlock, err := db.GetLastBlock()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last block"})
		return
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
		MinedBy:      walletID,
	}

	// Run Proof of Work
	blockchain.RunProofOfWork(&newBlock)

	// Insert block into database
	err = db.InsertBlock(&newBlock)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert block"})
		return
	}

	// Process all transactions in the block
	for _, tx := range transactions {
		// Mark inputs as spent
		for _, input := range tx.Vin {
			db.MarkUTXOAsSpent(input.TxID, input.Vout, tx.ID)
		}

		// Create new UTXOs from outputs
		blockchain.CreateUTXOsFromTransaction(tx, newBlock.Index)

		// Create transaction logs
		services.CreateTransactionLogs(tx, newBlock.Hash, newBlock.Index, "success")

		// Update pending transaction status
		db.UpdatePendingTransactionStatus(tx.ID, "mined")

		// Recalculate balances
		blockchain.RecalculateBalance(tx.SenderID)
		if tx.ReceiverID != "zakat_pool" {
			blockchain.RecalculateBalance(tx.ReceiverID)
		}
	}

	// Log mining event
	services.LogMining(walletID, newBlock.Index, newBlock.Hash, len(transactions))

	c.JSON(http.StatusOK, gin.H{
		"message":           "Block mined successfully",
		"block":             newBlock,
		"transactions_count": len(transactions),
	})
}

// ValidateBlockchain validates the entire blockchain
func ValidateBlockchain(c *gin.Context) {
	blocks, err := db.GetAllBlocks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get blockchain"})
		return
	}

	isValid := blockchain.ValidateChain(blocks)

	c.JSON(http.StatusOK, gin.H{
		"valid":  isValid,
		"blocks": len(blocks),
	})
}

// GetBlockchainStats returns statistics about the blockchain
func GetBlockchainStats(c *gin.Context) {
	blocks, err := db.GetAllBlocks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get blockchain"})
		return
	}

	var totalTransactions int
	var totalZakatTxs int
	for _, block := range blocks {
		totalTransactions += len(block.Transactions)
		for _, tx := range block.Transactions {
			if tx.IsZakat {
				totalZakatTxs++
			}
		}
	}

	users, _ := db.GetAllUsers()
	pendingTxs, _ := db.GetPendingTransactions()

	c.JSON(http.StatusOK, gin.H{
		"total_blocks":              len(blocks),
		"total_transactions":        totalTransactions,
		"total_zakat_transactions":  totalZakatTxs,
		"pending_transactions":      len(pendingTxs),
		"total_users":               len(users),
		"pow_difficulty":            config.AppConfig.POWDifficulty,
		"latest_block_hash":         blocks[len(blocks)-1].Hash,
	})
}
