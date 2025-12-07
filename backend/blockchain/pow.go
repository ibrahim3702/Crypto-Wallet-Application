package blockchain

import (
	"crypto-wallet/models"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

// CalculateMerkleRoot calculates the merkle root of all transactions in a block
func CalculateMerkleRoot(transactions []models.Transaction) string {
	if len(transactions) == 0 {
		return ""
	}

	var hashes []string
	for _, tx := range transactions {
		hashes = append(hashes, tx.ID)
	}

	// Build merkle tree
	for len(hashes) > 1 {
		var newLevel []string
		
		// If odd number of hashes, duplicate the last one
		if len(hashes)%2 != 0 {
			hashes = append(hashes, hashes[len(hashes)-1])
		}

		for i := 0; i < len(hashes); i += 2 {
			combined := hashes[i] + hashes[i+1]
			hash := sha256.Sum256([]byte(combined))
			newLevel = append(newLevel, hex.EncodeToString(hash[:]))
		}
		
		hashes = newLevel
	}

	return hashes[0]
}

// CalculateHash computes the SHA256 hash of a block
func CalculateHash(b models.Block) string {
	record := fmt.Sprintf("%d%d%s%s%d%s",
		b.Index,
		b.Timestamp,
		b.PrevHash,
		b.MerkleRoot,
		b.Nonce,
		b.MinedBy,
	)
	h := sha256.New()
	h.Write([]byte(record))
	return hex.EncodeToString(h.Sum(nil))
}

// RunProofOfWork performs the Proof of Work algorithm
func RunProofOfWork(b *models.Block) {
	target := strings.Repeat("0", b.Difficulty)
	b.Nonce = 0
	
	for {
		b.Hash = CalculateHash(*b)
		if strings.HasPrefix(b.Hash, target) {
			break
		}
		b.Nonce++
	}
}

// ValidateBlock validates a block's hash and structure
func ValidateBlock(block models.Block, prevBlock models.Block) bool {
	// Check index
	if block.Index != prevBlock.Index+1 {
		return false
	}

	// Check previous hash
	if block.PrevHash != prevBlock.Hash {
		return false
	}

	// Check hash validity
	calculatedHash := CalculateHash(block)
	if calculatedHash != block.Hash {
		return false
	}

	// Check proof of work
	target := strings.Repeat("0", block.Difficulty)
	if !strings.HasPrefix(block.Hash, target) {
		return false
	}

	return true
}

// ValidateChain validates the entire blockchain
func ValidateChain(blocks []models.Block) bool {
	if len(blocks) == 0 {
		return false
	}

	// Skip genesis block
	for i := 1; i < len(blocks); i++ {
		if !ValidateBlock(blocks[i], blocks[i-1]) {
			return false
		}
	}

	return true
}

// ValidateChainWithDetails validates the blockchain and returns the first problematic block index
// Returns -1 if chain is valid, otherwise returns the index of the first invalid block
func ValidateChainWithDetails(blocks []models.Block) (bool, int, string) {
	if len(blocks) == 0 {
		return false, -1, "Blockchain is empty"
	}

	// Skip genesis block (index 0)
	for i := 1; i < len(blocks); i++ {
		if !ValidateBlock(blocks[i], blocks[i-1]) {
			reason := ""
			
			// Determine the specific reason for failure
			if blocks[i].Index != blocks[i-1].Index+1 {
				reason = fmt.Sprintf("Invalid index: expected %d, got %d", blocks[i-1].Index+1, blocks[i].Index)
			} else if blocks[i].PrevHash != blocks[i-1].Hash {
				reason = "Previous hash mismatch"
			} else {
				calculatedHash := CalculateHash(blocks[i])
				if calculatedHash != blocks[i].Hash {
					reason = "Hash mismatch - block has been tampered with"
				} else {
					target := strings.Repeat("0", blocks[i].Difficulty)
					if !strings.HasPrefix(blocks[i].Hash, target) {
						reason = "Proof of work validation failed"
					}
				}
			}
			
			return false, i, reason
		}
	}

	return true, -1, "Blockchain is valid"
}