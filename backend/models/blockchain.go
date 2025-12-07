package models

import "time"

// TXInput: References a previous output
type TXInput struct {
	TxID      string `json:"tx_id" bson:"tx_id"`
	Vout      int    `json:"vout" bson:"vout"` // Index of output in prev Tx
	Signature string `json:"signature" bson:"signature"`
	PubKey    string `json:"pub_key" bson:"pub_key"` // Sender's Public Key
}

// TXOutput: The value locked to a receiver
type TXOutput struct {
	Value      float64 `json:"value" bson:"value"`
	PubKeyHash string  `json:"pub_key_hash" bson:"pub_key_hash"` // Receiver's Wallet ID
	IsSpent    bool    `json:"is_spent" bson:"is_spent"`
	SpentInTx  string  `json:"spent_in_tx,omitempty" bson:"spent_in_tx,omitempty"`
}

type Transaction struct {
	ID         string     `json:"id" bson:"id"`
	Vin        []TXInput  `json:"vin" bson:"vin"`
	Vout       []TXOutput `json:"vout" bson:"vout"`
	Timestamp  int64      `json:"timestamp" bson:"timestamp"`
	SenderID   string     `json:"sender_id" bson:"sender_id"`
	ReceiverID string     `json:"receiver_id" bson:"receiver_id"`
	Amount     float64    `json:"amount" bson:"amount"`
	Note       string     `json:"note,omitempty" bson:"note,omitempty"`
	IsZakat    bool       `json:"is_zakat" bson:"is_zakat"`
	Type       string     `json:"type" bson:"type"` // "transfer", "zakat_deduction", "mining_reward"
}

type Block struct {
	Index        int           `json:"index" bson:"index"`
	Timestamp    int64         `json:"timestamp" bson:"timestamp"`
	Transactions []Transaction `json:"transactions" bson:"transactions"`
	PrevHash     string        `json:"prev_hash" bson:"prev_hash"`
	Hash         string        `json:"hash" bson:"hash"`
	Nonce        int           `json:"nonce" bson:"nonce"`
	Difficulty   int           `json:"difficulty" bson:"difficulty"`
	MerkleRoot   string        `json:"merkle_root" bson:"merkle_root"`
	MinedBy      string        `json:"mined_by,omitempty" bson:"mined_by,omitempty"`
}

// User represents a registered user
type User struct {
	ID                string    `json:"id" bson:"_id,omitempty"`
	FullName          string    `json:"full_name" bson:"full_name"`
	Email             string    `json:"email" bson:"email"`
	CNIC              string    `json:"cnic" bson:"cnic"`
	WalletID          string    `json:"wallet_id" bson:"wallet_id"`
	PublicKey         string    `json:"public_key" bson:"public_key"`
	EncryptedPrivateKey string  `json:"-" bson:"encrypted_private_key"` // Never send in JSON
	IsEmailVerified   bool      `json:"is_email_verified" bson:"is_email_verified"`
	OTP               string    `json:"-" bson:"otp,omitempty"` // Hashed OTP
	OTPExpiry         time.Time `json:"-" bson:"otp_expiry,omitempty"`
	Beneficiaries     []string  `json:"beneficiaries" bson:"beneficiaries"` // List of wallet IDs
	CreatedAt         time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" bson:"updated_at"`
	LastLogin         time.Time `json:"last_login" bson:"last_login"`
}

// Wallet represents wallet information
type Wallet struct {
	WalletID      string    `json:"wallet_id" bson:"_id"`
	UserID        string    `json:"user_id" bson:"user_id"`
	PublicKey     string    `json:"public_key" bson:"public_key"`
	Balance       float64   `json:"balance" bson:"balance"` // Cached balance
	LastZakatDate time.Time `json:"last_zakat_date" bson:"last_zakat_date"`
	CreatedAt     time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" bson:"updated_at"`
}

// UTXO represents an unspent transaction output
type UTXO struct {
	ID         string    `json:"id" bson:"_id,omitempty"`
	TxID       string    `json:"tx_id" bson:"tx_id"`
	Vout       int       `json:"vout" bson:"vout"`
	WalletID   string    `json:"wallet_id" bson:"wallet_id"`
	Amount     float64   `json:"amount" bson:"amount"`
	IsSpent    bool      `json:"is_spent" bson:"is_spent"`
	SpentInTx  string    `json:"spent_in_tx,omitempty" bson:"spent_in_tx,omitempty"`
	IsLocked   bool      `json:"is_locked" bson:"is_locked"` // Locked for pending transactions
	LockedBy   string    `json:"locked_by,omitempty" bson:"locked_by,omitempty"` // Pending transaction ID
	BlockIndex int       `json:"block_index" bson:"block_index"`
	CreatedAt  time.Time `json:"created_at" bson:"created_at"`
}

// PendingTransaction represents a transaction waiting to be mined
type PendingTransaction struct {
	ID          string      `json:"id" bson:"_id"`
	Transaction Transaction `json:"transaction" bson:"transaction"`
	CreatedAt   time.Time   `json:"created_at" bson:"created_at"`
	Status      string      `json:"status" bson:"status"` // "pending", "mining", "mined", "failed"
}

// TransactionLog records all transaction events
type TransactionLog struct {
	ID          string    `json:"id" bson:"_id,omitempty"`
	UserID      string    `json:"user_id" bson:"user_id"`
	WalletID    string    `json:"wallet_id" bson:"wallet_id"`
	TxID        string    `json:"tx_id" bson:"tx_id"`
	Action      string    `json:"action" bson:"action"` // "sent", "received", "mined", "zakat_deducted"
	Amount      float64   `json:"amount" bson:"amount"`
	Counterparty string   `json:"counterparty,omitempty" bson:"counterparty,omitempty"`
	BlockHash   string    `json:"block_hash,omitempty" bson:"block_hash,omitempty"`
	BlockIndex  int       `json:"block_index,omitempty" bson:"block_index,omitempty"`
	Status      string    `json:"status" bson:"status"` // "success", "failed", "pending"
	Note        string    `json:"note,omitempty" bson:"note,omitempty"`
	Timestamp   time.Time `json:"timestamp" bson:"timestamp"`
}

// SystemLog records system events
type SystemLog struct {
	ID        string                 `json:"id" bson:"_id,omitempty"`
	Event     string                 `json:"event" bson:"event"` // "login", "signup", "failed_login", "invalid_wallet", "signature_failure", "mining", etc.
	UserID    string                 `json:"user_id,omitempty" bson:"user_id,omitempty"`
	IPAddress string                 `json:"ip_address,omitempty" bson:"ip_address,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty" bson:"details,omitempty"`
	Timestamp time.Time              `json:"timestamp" bson:"timestamp"`
	Severity  string                 `json:"severity" bson:"severity"` // "info", "warning", "error"
}

// ZakatRecord tracks zakat deductions
type ZakatRecord struct {
	ID          string    `json:"id" bson:"_id,omitempty"`
	UserID      string    `json:"user_id" bson:"user_id"`
	WalletID    string    `json:"wallet_id" bson:"wallet_id"`
	Amount      float64   `json:"amount" bson:"amount"`
	Balance     float64   `json:"balance_at_deduction" bson:"balance_at_deduction"`
	TxID        string    `json:"tx_id" bson:"tx_id"`
	BlockHash   string    `json:"block_hash" bson:"block_hash"`
	BlockIndex  int       `json:"block_index" bson:"block_index"`
	Timestamp   time.Time `json:"timestamp" bson:"timestamp"`
	Month       int       `json:"month" bson:"month"`
	Year        int       `json:"year" bson:"year"`
}

// SendMoneyRequest represents the request body for sending money
type SendMoneyRequest struct {
	ReceiverWalletID string  `json:"receiver_wallet_id" binding:"required"`
	Amount           float64 `json:"amount" binding:"required,gt=0"`
	Note             string  `json:"note"`
	PrivateKey       string  `json:"private_key" binding:"required"` // User sends decrypted private key temporarily
}

// SignupRequest represents user signup request
type SignupRequest struct {
	FullName string `json:"full_name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	CNIC     string `json:"cnic" binding:"required"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// VerifyOTPRequest represents OTP verification
type VerifyOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
	OTP   string `json:"otp" binding:"required"`
}

// UpdateProfileRequest represents profile update
type UpdateProfileRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email,email"`
}

// AddBeneficiaryRequest adds a beneficiary wallet
type AddBeneficiaryRequest struct {
	WalletID string `json:"wallet_id" binding:"required"`
}