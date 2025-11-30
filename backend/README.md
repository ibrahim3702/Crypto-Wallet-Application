# Decentralized Cryptocurrency Wallet Backend

A fully functional decentralized cryptocurrency wallet application built with Go, featuring blockchain, UTXO model, Proof-of-Work, digital signatures, and monthly Zakat deductions.

## 🚀 Features

- ✅ **Custom Blockchain Implementation** with SHA-256 hashing and Merkle roots
- ✅ **RSA Digital Signatures** for secure transaction verification
- ✅ **UTXO-Based Transaction Model** (Bitcoin-style)
- ✅ **Proof-of-Work Mining** with adjustable difficulty
- ✅ **Wallet System** with public/private key pairs
- ✅ **Monthly Zakat Deduction** (2.5% automatic)
- ✅ **JWT Authentication** with email OTP verification
- ✅ **Double-Spend Prevention**
- ✅ **Transaction Logging & Analytics**
- ✅ **MongoDB Atlas** for serverless database
- ✅ **RESTful API** with comprehensive endpoints

## 📋 Prerequisites

- Go 1.21 or higher
- MongoDB Atlas account (or any MongoDB instance)
- SMTP credentials (Gmail recommended for OTP emails)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/ibrahim3702/Crypto-Wallet-Application.git
cd Crypto-Wallet-Application/backend
```

### 2. Install dependencies

```bash
go mod download
```

### 3. Configure environment variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=8080
MONGODB_URI=your_mongodb_atlas_connection_string
DB_NAME=crypto_wallet
JWT_SECRET=your-super-secret-jwt-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
POW_DIFFICULTY=4
MINING_REWARD=50.0
ZAKAT_PERCENTAGE=2.5
```

### 4. Run the application

```bash
go run main.go
```

The server will start on `http://localhost:8080`

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "cnic": "12345-1234567-1"
}
```

#### POST `/api/auth/login`
Request OTP for login
```json
{
  "email": "john@example.com"
}
```

#### POST `/api/auth/verify-otp`
Verify OTP and get JWT token
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Wallet Endpoints

#### GET `/api/wallet/balance/:walletId`
Get balance for any wallet (public)

#### GET `/api/wallet/my-balance`
Get authenticated user's balance (requires JWT)

#### GET `/api/wallet/my-utxos`
Get all unspent UTXOs (requires JWT)

### Transaction Endpoints

#### POST `/api/transaction/send`
Send money to another wallet (requires JWT)
```json
{
  "receiver_wallet_id": "abc123...",
  "amount": 100.50,
  "note": "Payment for services",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----..."
}
```

#### GET `/api/transaction/history`
Get transaction history (requires JWT)

#### GET `/api/transaction/:txId`
Get transaction details (public)

### Blockchain Endpoints

#### GET `/api/blockchain/chain`
Get entire blockchain

#### GET `/api/blockchain/block/:index`
Get specific block by index

#### POST `/api/mining/mine`
Mine pending transactions (requires JWT)

#### GET `/api/blockchain/stats`
Get blockchain statistics

### Reports Endpoints

#### GET `/api/reports/monthly`
Get monthly transaction report (requires JWT)

#### GET `/api/reports/zakat`
Get Zakat deduction history (requires JWT)

## 🏗️ Project Structure

```
backend/
├── auth/               # JWT & OTP authentication
├── blockchain/         # Blockchain, PoW, UTXO logic
├── config/            # Configuration management
├── crypto/            # RSA keypair & signatures
├── db/                # MongoDB database layer
├── handlers/          # HTTP request handlers
├── middleware/        # Authentication & CORS middleware
├── models/            # Data models
├── services/          # Business logic (transactions, zakat, logging)
├── main.go            # Application entry point
├── go.mod             # Go dependencies
├── Dockerfile         # Docker configuration
└── README.md          # Documentation
```

## 🐳 Docker Deployment

### Build Docker image

```bash
docker build -t crypto-wallet-backend .
```

### Run with Docker

```bash
docker run -p 8080:8080 --env-file .env crypto-wallet-backend
```

## ☁️ Cloud Deployment

### Deploy to Fly.io

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Login and launch:
```bash
fly auth login
fly launch
```

3. Set environment variables:
```bash
fly secrets set MONGODB_URI="your_connection_string"
fly secrets set JWT_SECRET="your_secret"
fly secrets set SMTP_USER="your_email"
fly secrets set SMTP_PASSWORD="your_password"
```

4. Deploy:
```bash
fly deploy
```

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Deploy automatically on push

### Deploy to Railway

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

3. Set environment variables in Railway dashboard

## 🧪 Testing

### Test user signup
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","cnic":"12345-1234567-1"}'
```

### Test blockchain retrieval
```bash
curl http://localhost:8080/api/blockchain/chain
```

### Test balance check
```bash
curl http://localhost:8080/api/wallet/balance/YOUR_WALLET_ID
```

## 🔐 Security Features

- **Digital Signatures**: All transactions are signed with RSA-2048
- **Private Key Encryption**: Private keys stored encrypted with AES-256
- **JWT Authentication**: Secure API access with JWT tokens
- **OTP Verification**: Email-based OTP for login
- **Double-Spend Prevention**: UTXO validation before mining
- **Input Validation**: Comprehensive request validation

## 📊 Zakat System

The system automatically deducts 2.5% Zakat monthly on the 1st of each month:
- Runs automatically via background scheduler
- Creates blockchain transactions for deductions
- Maintains detailed Zakat records
- Can be manually triggered via admin endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is part of an academic assignment.

## 👨‍💻 Author

**Ibrahim**
- GitHub: [@ibrahim3702](https://github.com/ibrahim3702)

## 🙏 Acknowledgments

- Built with Go and Gin framework
- MongoDB Atlas for database
- RSA cryptography for digital signatures
- Inspired by Bitcoin's UTXO model

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This is an educational project. For production use, additional security measures and testing are recommended.
