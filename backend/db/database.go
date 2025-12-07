package db

import (
	"context"
	"crypto-wallet/config"
	"crypto-wallet/models"
	"errors"
	"log"
	"regexp"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var Database *mongo.Database

// Collections
var (
	BlocksCollection              *mongo.Collection
	UsersCollection               *mongo.Collection
	WalletsCollection             *mongo.Collection
	UTXOsCollection               *mongo.Collection
	PendingTransactionsCollection *mongo.Collection
	TransactionLogsCollection     *mongo.Collection
	SystemLogsCollection          *mongo.Collection
	ZakatRecordsCollection        *mongo.Collection
)

// ConnectDB establishes connection to MongoDB
func ConnectDB() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(config.AppConfig.MongoDBURI)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return err
	}

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	Client = client
	Database = client.Database(config.AppConfig.DBName)

	// Initialize collections
	BlocksCollection = Database.Collection("blocks")
	UsersCollection = Database.Collection("users")
	WalletsCollection = Database.Collection("wallets")
	UTXOsCollection = Database.Collection("utxos")
	PendingTransactionsCollection = Database.Collection("pending_transactions")
	TransactionLogsCollection = Database.Collection("transaction_logs")
	SystemLogsCollection = Database.Collection("system_logs")
	ZakatRecordsCollection = Database.Collection("zakat_records")

	// Create indexes
	createIndexes()

	log.Println("✅ Connected to MongoDB successfully")
	return nil
}

// createIndexes creates necessary indexes for efficient queries
func createIndexes() {
	ctx := context.Background()

	// Users indexes
	UsersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	UsersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "wallet_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// Wallets indexes
	WalletsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}},
	})

	// UTXOs indexes
	UTXOsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "wallet_id", Value: 1}, {Key: "is_spent", Value: 1}},
	})
	UTXOsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "tx_id", Value: 1}, {Key: "vout", Value: 1}},
	})

	// Blocks index
	BlocksCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "index", Value: -1}},
		Options: options.Index().SetUnique(true),
	})

	// Transaction logs index
	TransactionLogsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "wallet_id", Value: 1}, {Key: "timestamp", Value: -1}},
	})

	// System logs index
	SystemLogsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "timestamp", Value: -1}},
	})

	log.Println("✅ Database indexes created")
}

// DisconnectDB closes the database connection
func DisconnectDB() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return Client.Disconnect(ctx)
}

// User operations
func CreateUser(user *models.User) error {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	_, err := UsersCollection.InsertOne(context.Background(), user)
	return err
}

func GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	// Case-insensitive email search using regex
	// Escape special regex characters in email
	escapedEmail := regexp.QuoteMeta(email)
	filter := bson.M{"email": bson.M{"$regex": "^" + escapedEmail + "$", "$options": "i"}}
	err := UsersCollection.FindOne(context.Background(), filter).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserByWalletID(walletID string) (*models.User, error) {
	var user models.User
	err := UsersCollection.FindOne(context.Background(), bson.M{"wallet_id": walletID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func UpdateUser(email string, update bson.M) error {
	update["updated_at"] = time.Now()
	_, err := UsersCollection.UpdateOne(
		context.Background(),
		bson.M{"email": email},
		bson.M{"$set": update},
	)
	return err
}

func GetAllUsers() ([]models.User, error) {
	var users []models.User
	cursor, err := UsersCollection.Find(context.Background(), bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	
	if err = cursor.All(context.Background(), &users); err != nil {
		return nil, err
	}
	return users, nil
}

// Wallet operations
func CreateWallet(wallet *models.Wallet) error {
	wallet.CreatedAt = time.Now()
	wallet.UpdatedAt = time.Now()
	_, err := WalletsCollection.InsertOne(context.Background(), wallet)
	return err
}

func GetWallet(walletID string) (*models.Wallet, error) {
	var wallet models.Wallet
	err := WalletsCollection.FindOne(context.Background(), bson.M{"_id": walletID}).Decode(&wallet)
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

func UpdateWalletBalance(walletID string, balance float64) error {
	_, err := WalletsCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": walletID},
		bson.M{"$set": bson.M{"balance": balance, "updated_at": time.Now()}},
	)
	return err
}

func UpdateWalletZakatDate(walletID string) error {
	_, err := WalletsCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": walletID},
		bson.M{"$set": bson.M{"last_zakat_date": time.Now(), "updated_at": time.Now()}},
	)
	return err
}

// Block operations
func InsertBlock(block *models.Block) error {
	_, err := BlocksCollection.InsertOne(context.Background(), block)
	return err
}

func GetLastBlock() (*models.Block, error) {
	var block models.Block
	opts := options.FindOne().SetSort(bson.D{{Key: "index", Value: -1}})
	err := BlocksCollection.FindOne(context.Background(), bson.D{}, opts).Decode(&block)
	if err != nil {
		return nil, err
	}
	return &block, nil
}

func GetAllBlocks() ([]models.Block, error) {
	var blocks []models.Block
	opts := options.Find().SetSort(bson.D{{Key: "index", Value: 1}})
	cursor, err := BlocksCollection.Find(context.Background(), bson.D{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	
	if err = cursor.All(context.Background(), &blocks); err != nil {
		return nil, err
	}
	return blocks, nil
}

func GetBlockByIndex(index int) (*models.Block, error) {
	var block models.Block
	err := BlocksCollection.FindOne(context.Background(), bson.M{"index": index}).Decode(&block)
	if err != nil {
		return nil, err
	}
	return &block, nil
}

// UTXO operations
func CreateUTXO(utxo *models.UTXO) error {
	utxo.CreatedAt = time.Now()
	_, err := UTXOsCollection.InsertOne(context.Background(), utxo)
	return err
}

func GetUnspentUTXOs(walletID string) ([]models.UTXO, error) {
	var utxos []models.UTXO
	cursor, err := UTXOsCollection.Find(
		context.Background(),
		bson.M{"wallet_id": walletID, "is_spent": false},
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	
	if err = cursor.All(context.Background(), &utxos); err != nil {
		return nil, err
	}
	return utxos, nil
}

func MarkUTXOAsSpent(txID string, vout int, spentInTx string) error {
	_, err := UTXOsCollection.UpdateOne(
		context.Background(),
		bson.M{"tx_id": txID, "vout": vout},
		bson.M{"$set": bson.M{"is_spent": true, "spent_in_tx": spentInTx}},
	)
	return err
}

func GetUTXO(txID string, vout int) (*models.UTXO, error) {
	var utxo models.UTXO
	err := UTXOsCollection.FindOne(
		context.Background(),
		bson.M{"tx_id": txID, "vout": vout},
	).Decode(&utxo)
	if err != nil {
		return nil, err
	}
	return &utxo, nil
}

// LockUTXO locks a UTXO for a pending transaction
func LockUTXO(txID string, vout int, pendingTxID string) error {
	_, err := UTXOsCollection.UpdateOne(
		context.Background(),
		bson.M{"tx_id": txID, "vout": vout, "is_spent": false, "is_locked": false},
		bson.M{"$set": bson.M{"is_locked": true, "locked_by": pendingTxID}},
	)
	return err
}

// UnlockUTXO unlocks a UTXO (removes lock from pending transaction)
func UnlockUTXO(txID string, vout int) error {
	_, err := UTXOsCollection.UpdateOne(
		context.Background(),
		bson.M{"tx_id": txID, "vout": vout},
		bson.M{"$set": bson.M{"is_locked": false}, "$unset": bson.M{"locked_by": ""}},
	)
	return err
}

// UnlockUTXOsByPendingTx unlocks all UTXOs locked by a specific pending transaction
func UnlockUTXOsByPendingTx(pendingTxID string) error {
	_, err := UTXOsCollection.UpdateMany(
		context.Background(),
		bson.M{"locked_by": pendingTxID},
		bson.M{"$set": bson.M{"is_locked": false}, "$unset": bson.M{"locked_by": ""}},
	)
	return err
}

// Pending Transaction operations
func AddPendingTransaction(ptx *models.PendingTransaction) error {
	ptx.CreatedAt = time.Now()
	ptx.Status = "pending"
	_, err := PendingTransactionsCollection.InsertOne(context.Background(), ptx)
	return err
}

func GetPendingTransactions() ([]models.PendingTransaction, error) {
	var txs []models.PendingTransaction
	cursor, err := PendingTransactionsCollection.Find(
		context.Background(),
		bson.M{"status": "pending"},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	
	if err = cursor.All(context.Background(), &txs); err != nil {
		return nil, err
	}
	return txs, nil
}

func UpdatePendingTransactionStatus(txID string, status string) error {
	_, err := PendingTransactionsCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": txID},
		bson.M{"$set": bson.M{"status": status}},
	)
	return err
}

func DeletePendingTransaction(txID string) error {
	_, err := PendingTransactionsCollection.DeleteOne(
		context.Background(),
		bson.M{"_id": txID},
	)
	return err
}

// Transaction Log operations
func CreateTransactionLog(log *models.TransactionLog) error {
	log.Timestamp = time.Now()
	_, err := TransactionLogsCollection.InsertOne(context.Background(), log)
	return err
}

func GetTransactionLogsByWallet(walletID string, limit int) ([]models.TransactionLog, error) {
	var logs []models.TransactionLog
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}).SetLimit(int64(limit))
	cursor, err := TransactionLogsCollection.Find(
		context.Background(),
		bson.M{"wallet_id": walletID},
		opts,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	
	if err = cursor.All(context.Background(), &logs); err != nil {
		return nil, err
	}
	return logs, nil
}

// System Log operations
func CreateSystemLog(log *models.SystemLog) error {
	log.Timestamp = time.Now()
	_, err := SystemLogsCollection.InsertOne(context.Background(), log)
	return err
}

func GetSystemLogs(limit int) ([]models.SystemLog, error) {
	var logs []models.SystemLog
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}).SetLimit(int64(limit))
	cursor, err := SystemLogsCollection.Find(context.Background(), bson.D{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	
	if err = cursor.All(context.Background(), &logs); err != nil {
		return nil, err
	}
	return logs, nil
}

// Zakat Record operations
func CreateZakatRecord(record *models.ZakatRecord) error {
	record.Timestamp = time.Now()
	_, err := ZakatRecordsCollection.InsertOne(context.Background(), record)
	return err
}

func GetZakatRecordsByWallet(walletID string) ([]models.ZakatRecord, error) {
	var records []models.ZakatRecord
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}})
	cursor, err := ZakatRecordsCollection.Find(
		context.Background(),
		bson.M{"wallet_id": walletID},
		opts,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	
	if err = cursor.All(context.Background(), &records); err != nil {
		return nil, err
	}
	return records, nil
}

func GetZakatRecordsByMonth(month, year int) ([]models.ZakatRecord, error) {
	var records []models.ZakatRecord
	cursor, err := ZakatRecordsCollection.Find(
		context.Background(),
		bson.M{"month": month, "year": year},
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	
	if err = cursor.All(context.Background(), &records); err != nil {
		return nil, err
	}
	return records, nil
}

// Helper function to check if wallet exists
func WalletExists(walletID string) bool {
	count, err := WalletsCollection.CountDocuments(
		context.Background(),
		bson.M{"_id": walletID},
	)
	if err != nil {
		return false
	}
	return count > 0
}

// InitializeGenesisBlock creates the first block if blockchain is empty
func InitializeGenesisBlock() error {
	count, err := BlocksCollection.CountDocuments(context.Background(), bson.D{})
	if err != nil {
		return err
	}

	if count == 0 {
		genesisBlock := models.Block{
			Index:        0,
			Timestamp:    time.Now().Unix(),
			Transactions: []models.Transaction{},
			PrevHash:     "0",
			Hash:         "genesis",
			Nonce:        0,
			Difficulty:   0,
			MerkleRoot:   "genesis",
		}
		
		err = InsertBlock(&genesisBlock)
		if err != nil {
			return err
		}
		log.Println("✅ Genesis block created")
	}
	return nil
}

// Validate that a wallet exists before transaction
func ValidateWalletExists(walletID string) error {
	if !WalletExists(walletID) {
		return errors.New("invalid wallet ID: wallet does not exist")
	}
	return nil
}

// DeleteBlocksFromIndex deletes all blocks from the specified index onwards
func DeleteBlocksFromIndex(startIndex int) error {
	_, err := BlocksCollection.DeleteMany(
		context.Background(),
		bson.M{"index": bson.M{"$gte": startIndex}},
	)
	return err
}

// DeleteUTXOsByTransactionID deletes all UTXOs created by a specific transaction
func DeleteUTXOsByTransactionID(txID string) error {
	_, err := UTXOsCollection.DeleteMany(
		context.Background(),
		bson.M{"tx_id": txID},
	)
	return err
}

// GetUTXOsByWalletID retrieves all UTXOs for a specific wallet
func GetUTXOsByWalletID(walletID string) ([]models.UTXO, error) {
	var utxos []models.UTXO
	cursor, err := UTXOsCollection.Find(
		context.Background(),
		bson.M{"wallet_id": walletID, "is_spent": false},
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	
	if err = cursor.All(context.Background(), &utxos); err != nil {
		return nil, err
	}
	return utxos, nil
}

// UpdateUserBalance updates a user's balance by their user ID
func UpdateUserBalance(userID string, balance float64) error {
	_, err := UsersCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{"balance": balance, "updated_at": time.Now()}},
	)
	return err
}
