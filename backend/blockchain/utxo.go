package blockchain

import (
	"crypto-wallet/db"
	"crypto-wallet/models"
	"crypto/sha256"
	"encoding/hex"
	"errors"
)

// GenerateWalletID generates a wallet ID by hashing the public key
func GenerateWalletID(pubKey string) string {
	hash := sha256.Sum256([]byte(pubKey))
	return hex.EncodeToString(hash[:])
}

// FindUTXOs finds all unspent transaction outputs for a wallet (from database)
func FindUTXOs(walletID string) ([]models.UTXO, error) {
	return db.GetUnspentUTXOs(walletID)
}

// GetBalance calculates the total balance for a wallet
func GetBalance(walletID string) (float64, error) {
	utxos, err := FindUTXOs(walletID)
	if err != nil {
		return 0, err
	}

	balance := 0.0
	for _, utxo := range utxos {
		if !utxo.IsSpent {
			balance += utxo.Amount
		}
	}
	return balance, nil
}

// SelectUTXOs selects UTXOs to cover the required amount (with change)
func SelectUTXOs(walletID string, amount float64) ([]models.UTXO, float64, error) {
	utxos, err := FindUTXOs(walletID)
	if err != nil {
		return nil, 0, err
	}

	var selectedUTXOs []models.UTXO
	var total float64

	for _, utxo := range utxos {
		// Only select UTXOs that are not spent AND not locked
		if !utxo.IsSpent && !utxo.IsLocked {
			selectedUTXOs = append(selectedUTXOs, utxo)
			total += utxo.Amount

			if total >= amount {
				change := total - amount
				return selectedUTXOs, change, nil
			}
		}
	}

	return nil, 0, errors.New("insufficient balance - all available UTXOs are spent or locked in pending transactions")
}

// MarkUTXOsAsSpent marks selected UTXOs as spent in the database
func MarkUTXOsAsSpent(utxos []models.UTXO, spentInTx string) error {
	for _, utxo := range utxos {
		err := db.MarkUTXOAsSpent(utxo.TxID, utxo.Vout, spentInTx)
		if err != nil {
			return err
		}
	}
	return nil
}

// CreateUTXOsFromTransaction creates new UTXOs from a transaction's outputs
func CreateUTXOsFromTransaction(tx models.Transaction, blockIndex int) error {
	for vout, output := range tx.Vout {
		utxo := models.UTXO{
			TxID:       tx.ID,
			Vout:       vout,
			WalletID:   output.PubKeyHash,
			Amount:     output.Value,
			IsSpent:    false,
			BlockIndex: blockIndex,
		}
		
		err := db.CreateUTXO(&utxo)
		if err != nil {
			return err
		}
	}
	return nil
}

// LockUTXOs locks selected UTXOs for a pending transaction
func LockUTXOs(utxos []models.UTXO, pendingTxID string) error {
	for _, utxo := range utxos {
		err := db.LockUTXO(utxo.TxID, utxo.Vout, pendingTxID)
		if err != nil {
			return err
		}
	}
	return nil
}

// UnlockUTXOs unlocks UTXOs (used when transaction fails or is cancelled)
func UnlockUTXOs(utxos []models.UTXO) error {
	for _, utxo := range utxos {
		err := db.UnlockUTXO(utxo.TxID, utxo.Vout)
		if err != nil {
			return err
		}
	}
	return nil
}

// RecalculateBalance recalculates balance from UTXOs and updates wallet
func RecalculateBalance(walletID string) error {
	balance, err := GetBalance(walletID)
	if err != nil {
		return err
	}

	return db.UpdateWalletBalance(walletID, balance)
}

// ValidateUTXONotSpent checks if a UTXO has already been spent (double-spend prevention)
func ValidateUTXONotSpent(txID string, vout int) error {
	utxo, err := db.GetUTXO(txID, vout)
	if err != nil {
		return errors.New("UTXO not found")
	}

	if utxo.IsSpent {
		return errors.New("UTXO already spent - double spend attempt detected")
	}

	return nil
}