package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	MongoDBURI        string
	DBName            string
	JWTSecret         string
	SMTPHost          string
	SMTPPort          int
	SMTPUser          string
	SMTPPassword      string
	POWDifficulty     int
	MiningReward      float64
	ZakatPercentage   float64
	ZakatWalletID     string
	AESEncryptionKey  string
}

var AppConfig *Config

func LoadConfig() {
	// Load .env file if it exists (for local development)
	_ = godotenv.Load()

	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))
	powDifficulty, _ := strconv.Atoi(getEnv("POW_DIFFICULTY", "4"))
	miningReward, _ := strconv.ParseFloat(getEnv("MINING_REWARD", "50.0"), 64)
	zakatPercentage, _ := strconv.ParseFloat(getEnv("ZAKAT_PERCENTAGE", "2.5"), 64)

	AppConfig = &Config{
		Port:              getEnv("PORT", "8080"),
		MongoDBURI:        getEnv("MONGODB_URI", ""),
		DBName:            getEnv("DB_NAME", "crypto_wallet"),
		JWTSecret:         getEnv("JWT_SECRET", "default-secret-key-change-me"),
		SMTPHost:          getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:          smtpPort,
		SMTPUser:          getEnv("SMTP_USER", ""),
		SMTPPassword:      getEnv("SMTP_PASSWORD", ""),
		POWDifficulty:     powDifficulty,
		MiningReward:      miningReward,
		ZakatPercentage:   zakatPercentage,
		ZakatWalletID:     getEnv("ZAKAT_WALLET_ID", "zakat_pool_wallet"),
		AESEncryptionKey:  getEnv("AES_ENCRYPTION_KEY", "change-this-32-char-key-prod!"),
	}

	if AppConfig.MongoDBURI == "" {
		log.Fatal("MONGODB_URI is required in environment variables")
	}

	log.Println("Configuration loaded successfully")
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
