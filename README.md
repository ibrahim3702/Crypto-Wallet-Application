# Crypto-Wallet-Application

A fully functional decentralized cryptocurrency wallet system with blockchain implementation, featuring UTXO-based transactions, Proof-of-Work consensus, and automated Zakat deduction for Shariah compliance.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go](https://img.shields.io/badge/Go-1.21-00ADD8?logo=go)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Blockchain Features
- **UTXO Model**: Bitcoin-inspired Unspent Transaction Output model for parallel transaction processing
- **Proof-of-Work**: SHA-256 based mining with adjustable difficulty (default: 3 leading zeros)
- **Digital Signatures**: RSA-2048 cryptographic signatures for transaction authentication
- **Merkle Trees**: Efficient transaction verification using Merkle root hashing
- **Double-Spend Prevention**: UTXO locking mechanism prevents spending same funds twice

### Wallet Features
- **Wallet Creation**: Automatic RSA keypair generation during user registration
- **Balance Tracking**: Real-time balance computation from UTXO set
- **Transaction History**: Complete audit trail of all wallet activities
- **Email-Based Sending**: Send funds using recipient's email instead of wallet ID
- **Private Key Encryption**: AES-256-CBC encryption for private key storage

### Islamic Finance
- **Automated Zakat**: Monthly 2.5% deduction following Shariah principles
- **Zakat Tracking**: Complete history and audit trail of deductions
- **Manual Trigger**: Admin capability to trigger Zakat deduction on-demand
- **Compliance Reporting**: Detailed reports for religious obligations

### User Interface
- **Modern Dashboard**: React-based responsive UI with dark theme
- **Interactive Charts**: Real-time balance and transaction volume visualization
- **Blockchain Explorer**: View complete chain with block and transaction details
- **Reports & Analytics**: Comprehensive statistics and system logs

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │  Wallet  │  │Blockchain│  │ Reports  │       │
│  │          │  │  & Send  │  │ Explorer │  │          │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │              │             │               │
│       └─────────────┴──────────────┴─────────────┘               │
│                          │                                        │
│                    Axios HTTP Client                             │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           │ REST API (JSON)
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    BACKEND (Go + Gin)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   API Layer (Handlers)                   │   │
│  │  • Authentication  • Transactions  • Mining  • Reports   │   │
│  └────────────┬────────────────────────────────────────────┘   │
│               │                                                  │
│  ┌────────────┴─────────────────────────────────────────────┐  │
│  │                   Business Logic Layer                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │  │
│  │  │  Crypto  │  │   UTXO   │  │   PoW    │  │  Zakat  │ │  │
│  │  │Signatures│  │ Selection│  │  Mining  │  │Scheduler│ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                  │
│  ┌────────────┴─────────────────────────────────────────────┐  │
│  │                   Database Layer (MongoDB)                │  │
│  │  • Users  • Blocks  • UTXOs  • Transactions  • Logs      │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           │ MongoDB Driver
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                   MongoDB Atlas (Cloud)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Collections: users, blocks, utxos, transactions,        │  │
│  │  transaction_logs, zakat_records, system_logs           │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Transaction Creation Flow
```
User Input → Frontend Validation → API Request
    ↓
JWT Authentication → UTXO Selection → Balance Check
    ↓
Digital Signature Creation → UTXO Locking
    ↓
Add to Pending Pool → Return Success
    ↓
Mining Process → UTXO Unlock → Mark as Spent
    ↓
Create New UTXOs → Update Blockchain
```

#### Mining Flow
```
Mine Request → Fetch Pending Transactions
    ↓
Validate Each Transaction → Filter Invalid
    ↓
Create Coinbase Transaction (50 CW Reward)
    ↓
Calculate Merkle Root → Create Block Header
    ↓
Run Proof-of-Work (Find Valid Nonce)
    ↓
Insert Block → Process Transactions
    ↓
Update UTXOs → Create Logs → Recalculate Balances
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.2.0
- **Styling**: Tailwind CSS 3.4.1
- **HTTP Client**: Axios 1.7.2
- **Routing**: React Router DOM 6.22.3
- **Icons**: Lucide React 0.263.1
- **State Management**: React Context API

### Backend
- **Language**: Go 1.21
- **Web Framework**: Gin 1.9.1
- **Database Driver**: MongoDB Go Driver 1.13.1
- **Authentication**: JWT-Go 5.2.0
- **Cryptography**: Go crypto package (RSA, SHA-256, AES)
- **Email**: SMTP (Gmail)

### Database
- **Database**: MongoDB Atlas (Serverless)
- **ORM**: Native MongoDB Go Driver
- **Indexing**: Compound indexes on frequently queried fields
- **Backup**: Automatic cloud backups

### DevOps & Deployment
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Fly.io / Render
- **Version Control**: Git + GitHub
- **CI/CD**: Vercel Auto-deployment

---

## 🗄️ Database Schema

### Collections Overview

```
crypto_wallet (Database)
├── users
├── wallets
├── blocks
├── transactions
├── utxos
├── transaction_logs
├── zakat_records
└── system_logs
```

### 1. Users Collection

```javascript
{
  _id: ObjectId("..."),
  full_name: String,              // User's full name
  email: String,                  // Unique email (indexed)
  cnic: String,                   // National ID
  wallet_id: String,              // Derived from public key (indexed)
  public_key: String,             // RSA-2048 public key (PEM format)
  encrypted_private_key: String,  // AES-256 encrypted private key
  otp: String,                    // Current OTP for login
  otp_expiry: ISODate,            // OTP expiration timestamp
  is_verified: Boolean,           // Email verification status
  created_at: ISODate,
  updated_at: ISODate
}

// Indexes
- { email: 1 } UNIQUE
- { wallet_id: 1 }
- { email: 1, wallet_id: 1 }
```

### 2. Blocks Collection

```javascript
{
  _id: ObjectId("..."),
  index: Int64,                   // Block number (sequential)
  timestamp: Int64,               // Unix timestamp
  transactions: [                 // Array of Transaction objects
    {
      id: String,                 // Transaction hash
      vin: [TXInput],             // Transaction inputs
      vout: [TXOutput],           // Transaction outputs
      sender_id: String,          // Sender wallet ID
      receiver_id: String,        // Receiver wallet ID
      amount: Float64,            // Transaction amount
      note: String,               // Optional note
      timestamp: Int64,
      is_zakat: Boolean,          // Zakat deduction flag
      type: String                // "transfer", "mining_reward", "zakat_deduction"
    }
  ],
  prev_hash: String,              // Previous block hash (SHA-256)
  hash: String,                   // Current block hash (SHA-256)
  nonce: Int64,                   // Proof-of-Work nonce
  difficulty: Int32,              // PoW difficulty level
  merkle_root: String,            // Merkle tree root hash
  mined_by: String                // Miner's wallet ID
}

// Indexes
- { index: 1 } PRIMARY
- { hash: 1 } UNIQUE
- { timestamp: 1, index: 1 }
- { mined_by: 1 }
```

### 3. UTXOs Collection

```javascript
{
  _id: ObjectId("..."),
  tx_id: String,                  // Source transaction ID
  vout: Int32,                    // Output index in transaction
  wallet_id: String,              // Owner's wallet ID
  amount: Float64,                // UTXO value in CW
  is_spent: Boolean,              // Spent status
  spent_in_tx: String,            // Transaction that spent this UTXO
  is_locked: Boolean,             // Locked for pending transaction
  locked_by: String,              // Pending transaction ID
  block_index: Int64,             // Block where UTXO was created
  created_at: ISODate
}

// Indexes
- { wallet_id: 1, is_spent: 1 } COMPOUND
- { tx_id: 1, vout: 1 } UNIQUE
- { is_locked: 1 }
- { locked_by: 1 }
```

### 4. Pending Transactions Collection

```javascript
{
  _id: String,                    // Transaction ID
  transaction: Transaction,       // Full transaction object
  created_at: ISODate,
  status: String                  // "pending", "mining", "mined", "failed"
}

// Indexes
- { status: 1 }
- { created_at: 1 }
```

### 5. Transaction Logs Collection

```javascript
{
  _id: ObjectId("..."),
  wallet_id: String,              // User's wallet ID
  action: String,                 // "sent", "received", "mined", "zakat_deduction"
  amount: Float64,                // Transaction amount (negative for sent)
  counterparty: String,           // Other party's wallet ID
  status: String,                 // "success", "pending", "failed"
  block_hash: String,             // Block hash where confirmed
  block_index: Int64,             // Block number
  timestamp: ISODate,
  note: String,                   // Transaction note
  ip_address: String              // User's IP address
}

// Indexes
- { wallet_id: 1, timestamp: -1 } COMPOUND
- { status: 1 }
- { action: 1 }
```

### 6. Zakat Records Collection

```javascript
{
  _id: ObjectId("..."),
  wallet_id: String,              // User's wallet ID
  amount: Float64,                // Zakat amount deducted
  balance_before: Float64,        // Balance before deduction
  balance_after: Float64,         // Balance after deduction
  transaction_id: String,         // Zakat transaction ID
  hijri_date: String,             // Islamic calendar date
  deduction_date: ISODate,        // Gregorian date
  created_at: ISODate
}

// Indexes
- { wallet_id: 1, deduction_date: -1 } COMPOUND
- { deduction_date: 1 }
```

### 7. System Logs Collection

```javascript
{
  _id: ObjectId("..."),
  level: String,                  // "info", "warning", "error"
  event_type: String,             // "user_login", "block_mined", etc.
  message: String,                // Log message
  user_id: String,                // Associated user (if applicable)
  ip_address: String,             // Request IP address
  metadata: Object,               // Additional context
  timestamp: ISODate
}

// Indexes
- { level: 1, timestamp: -1 } COMPOUND
- { event_type: 1 }
- { timestamp: 1 } TTL (90 days)
```

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    Users    │         │   Blocks    │         │    UTXOs    │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ _id         │◄───┐    │ index       │         │ tx_id       │
│ wallet_id   │    │    │ timestamp   │         │ vout        │
│ email       │    │    │ transactions│◄────────┤ wallet_id   │
│ public_key  │    │    │ prev_hash   │         │ amount      │
│ private_key │    │    │ hash        │         │ is_spent    │
└─────────────┘    │    │ nonce       │         │ is_locked   │
                   │    │ mined_by    │         │ locked_by   │
                   │    └─────────────┘         └─────────────┘
                   │            │                       │
                   │            │                       │
                   │    ┌───────┴────────┐             │
                   │    │                │             │
          ┌────────┴────┴────┐  ┌────────┴─────────────┴───┐
          │ Transaction Logs  │  │  Pending Transactions    │
          ├───────────────────┤  ├──────────────────────────┤
          │ wallet_id         │  │ transaction              │
          │ action            │  │ status                   │
          │ amount            │  │ created_at               │
          │ timestamp         │  └──────────────────────────┘
          └───────────────────┘
                   │
          ┌────────┴────────┐
          │  Zakat Records  │
          ├─────────────────┤
          │ wallet_id       │
          │ amount          │
          │ deduction_date  │
          └─────────────────┘
```

---

## 📡 API Documentation

### Base URL
- **Development**: `http://localhost:8080/api`
- **Production**: `https://crypto-wallet-backend.fly.dev/api`

### Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

### 🔓 Public Endpoints

#### Authentication

##### POST `/auth/signup`
Register a new user and create wallet.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "cnic": "12345-1234567-1"
}
```

**Response (200):**
```json
{
  "message": "User registered successfully. OTP sent to your email.",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "wallet_id": "0x1a2b3c...",
    "public_key": "-----BEGIN RSA PUBLIC KEY-----...",
    "private_key": "-----BEGIN RSA PRIVATE KEY-----..."
  }
}
```

##### POST `/auth/login`
Login with email (generates OTP).

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "OTP sent to your email",
  "otp_expiry": "2024-12-07T12:45:00Z"
}
```

##### POST `/auth/verify-otp`
Verify OTP and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "full_name": "John Doe",
    "email": "john@example.com",
    "wallet_id": "0x1a2b3c..."
  }
}
```

##### POST `/auth/resend-otp`
Resend OTP if expired.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### Blockchain Explorer

##### GET `/blockchain/chain`
Get entire blockchain.

**Response (200):**
```json
{
  "blockchain": [
    {
      "index": 0,
      "timestamp": 1701936000,
      "transactions": [...],
      "prev_hash": "0",
      "hash": "000abc123...",
      "nonce": 12345,
      "difficulty": 3,
      "merkle_root": "def456...",
      "mined_by": "genesis"
    }
  ],
  "length": 42
}
```

##### GET `/blockchain/block/:index`
Get specific block by index.

**Response (200):**
```json
{
  "block": {
    "index": 5,
    "timestamp": 1701936500,
    "transactions": [...],
    "hash": "000def456..."
  }
}
```

##### GET `/blockchain/latest`
Get most recent block.

##### GET `/blockchain/validate`
Validate entire blockchain integrity.

**Response (200):**
```json
{
  "valid": true,
  "blocks": 42
}
```

##### GET `/blockchain/stats`
Get blockchain statistics.

**Response (200):**
```json
{
  "total_blocks": 42,
  "total_transactions": 156,
  "total_zakat_transactions": 8,
  "pending_transactions": 3,
  "total_users": 25,
  "pow_difficulty": 3,
  "latest_block_hash": "000abc123..."
}
```

#### Wallet Validation

##### GET `/wallet/validate/:walletId`
Check if wallet ID exists.

##### GET `/wallet/balance/:walletId`
Get public balance for any wallet.

**Response (200):**
```json
{
  "wallet_id": "0x1a2b3c...",
  "balance": 125.50
}
```

##### GET `/wallet/info/:walletId`
Get public wallet information.

#### User Search

##### GET `/user/search?email=user@example.com`
Search user by email (for sending transactions).

**Response (200):**
```json
{
  "wallet_id": "0x1a2b3c...",
  "full_name": "John Doe",
  "email": "john@example.com"
}
```

#### Transactions

##### GET `/transaction/:txId`
Get transaction details by ID.

##### GET `/transactions/pending`
Get all pending transactions.

---

### 🔒 Protected Endpoints

#### User Profile

##### GET `/user/profile`
Get authenticated user's profile.

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "full_name": "John Doe",
    "email": "john@example.com",
    "cnic": "12345-1234567-1",
    "wallet_id": "0x1a2b3c...",
    "created_at": "2024-12-01T00:00:00Z"
  }
}
```

##### PUT `/user/profile`
Update user profile.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "cnic": "54321-7654321-1"
}
```

##### GET `/user/private-key`
Retrieve encrypted private key.

**Response (200):**
```json
{
  "encrypted_private_key": "iv:ciphertext...",
  "warning": "Keep this secure!"
}
```

#### Wallet Operations

##### GET `/wallet/my-balance`
Get authenticated user's balance.

**Response (200):**
```json
{
  "wallet_id": "0x1a2b3c...",
  "balance": 125.50,
  "utxo_count": 5
}
```

##### GET `/wallet/my-info`
Get authenticated user's wallet details.

##### GET `/wallet/my-utxos`
Get all UTXOs for authenticated user.

**Response (200):**
```json
{
  "utxos": [
    {
      "tx_id": "abc123...",
      "vout": 0,
      "amount": 50.00,
      "is_spent": false,
      "is_locked": false,
      "locked_by": null,
      "block_index": 5
    }
  ],
  "total_balance": 125.50
}
```

##### GET `/wallet/beneficiaries`
Get saved beneficiaries list.

##### POST `/wallet/beneficiary`
Add a beneficiary.

**Request Body:**
```json
{
  "wallet_id": "0xabc456...",
  "name": "Alice"
}
```

##### DELETE `/wallet/beneficiary/:walletId`
Remove a beneficiary.

#### Transactions

##### POST `/transaction/send`
Create and send a transaction.

**Request Body:**
```json
{
  "receiver_wallet_id": "0xabc456...",
  "amount": 25.50,
  "note": "Payment for services",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----..."
}
```

**Response (201):**
```json
{
  "message": "Transaction created and added to pending pool",
  "tx_id": "tx_abc123...",
  "amount": 25.50,
  "receiver": "0xabc456...",
  "status": "pending",
  "note": "Transaction will be processed when the next block is mined"
}
```

##### GET `/transaction/history?limit=50`
Get transaction history for authenticated user.

**Response (200):**
```json
{
  "wallet_id": "0x1a2b3c...",
  "transactions": [
    {
      "action": "sent",
      "amount": -25.50,
      "counterparty": "0xabc456...",
      "status": "success",
      "timestamp": "2024-12-07T10:30:00Z",
      "note": "Payment for services"
    }
  ],
  "count": 15
}
```

##### GET `/transaction/my-pending`
Get pending transactions for authenticated user.

##### GET `/transaction/zakat-history`
Get Zakat deduction history.

#### Mining

##### POST `/mining/mine`
Mine a new block with pending transactions.

**Response (200):**
```json
{
  "message": "Block mined successfully",
  "block": {
    "index": 43,
    "hash": "000abc789...",
    "prev_hash": "000def456...",
    "nonce": 15234,
    "transactions": [...]
  },
  "transactions_count": 4
}
```

#### Reports

##### GET `/reports/monthly`
Get monthly transaction report.

**Response (200):**
```json
{
  "month": "December 2024",
  "total_sent": 150.75,
  "total_received": 200.00,
  "total_zakat": 5.12,
  "transaction_count": 25
}
```

##### GET `/reports/zakat`
Get Zakat deduction records.

**Response (200):**
```json
{
  "zakat_records": [
    {
      "amount": 2.56,
      "balance_before": 102.40,
      "balance_after": 99.84,
      "deduction_date": "2024-12-01T00:00:00Z",
      "hijri_date": "Jumada I 28, 1446"
    }
  ]
}
```

##### GET `/reports/stats`
Get transaction statistics.

**Response (200):**
```json
{
  "total_transactions": 156,
  "total_sent": 1250.00,
  "total_received": 1300.00,
  "average_transaction": 41.67
}
```

#### Admin

##### GET `/admin/system-stats`
Get system-wide statistics.

##### GET `/admin/system-logs`
Get system logs.

**Response (200):**
```json
{
  "logs": [
    {
      "level": "info",
      "event_type": "block_mined",
      "message": "Block 43 mined successfully",
      "timestamp": "2024-12-07T10:45:00Z"
    }
  ]
}
```

##### POST `/admin/trigger-zakat`
Manually trigger Zakat deduction for all eligible wallets.

**Response (200):**
```json
{
  "message": "Zakat deduction triggered successfully",
  "wallets_processed": 15,
  "total_zakat_collected": 38.25
}
```

---

## 🚀 Installation

### Prerequisites

- **Go**: 1.21 or higher
- **Node.js**: 18.x or higher
- **MongoDB Atlas Account**: Free tier
- **Gmail Account**: For OTP emails (with App Password)

### Backend Setup

1. **Clone the repository:**
```bash
git clone https://github.com/ibrahim3702/Crypto-Wallet-Application.git
cd Crypto-Wallet-Application/backend
```

2. **Install Go dependencies:**
```bash
go mod download
```

3. **Create `.env` file:**
```bash
cp .env.example .env
```

4. **Configure environment variables** (see Configuration section)

5. **Run the backend:**
```bash
go run main.go
```

Backend will start on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
```bash
echo "VITE_API_URL=http://localhost:8080/api" > .env
```

4. **Run the development server:**
```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env` file with:

```env
# Server Configuration
PORT=8080

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=crypto_wallet

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Gmail App Password, not regular password

# AES Encryption Key (32 characters for AES-256)
AES_ENCRYPTION_KEY=12345678901234567890123456789012

# Blockchain Configuration
POW_DIFFICULTY=3          # Number of leading zeros required
MINING_REWARD=50.0        # CW coins awarded for mining a block

# Zakat Configuration
ZAKAT_PERCENTAGE=2.5      # Annual Zakat rate
ZAKAT_WALLET_ID=zakat_pool_wallet
```

### Frontend Environment Variables

Create `frontend/.env` file with:

```env
# API Base URL
VITE_API_URL=http://localhost:8080/api

# Production
# VITE_API_URL=https://crypto-wallet-backend.fly.dev/api
```

### MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with read/write permissions
3. Whitelist your IP address (or use 0.0.0.0/0 for development)
4. Get connection string and add to `MONGODB_URI`
5. Database and collections will be created automatically

### Gmail App Password

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings → Security → App Passwords
3. Generate an app password for "Mail"
4. Use this password in `SMTP_PASSWORD` (not your regular Gmail password)

---

## 📖 Usage

### 1. Register and Login

1. Open `http://localhost:5173`
2. Click "Sign Up"
3. Enter full name, email, and CNIC
4. Check email for OTP
5. Enter OTP to login
6. **IMPORTANT**: Save your private key displayed on registration (shown only once!)

### 2. Mine Initial Blocks

1. Navigate to "Mine" page
2. Click "Start Mining"
3. Wait for Proof-of-Work to complete (~1-2 seconds)
4. Receive 50 CW mining reward
5. Balance updates automatically

### 3. Send Transactions

**Option A: Using Email**
1. Go to "Send Money" page
2. Toggle "Search by Email"
3. Enter recipient's email
4. Click "Search User"
5. Verify recipient details
6. Enter amount and note
7. Paste your private key
8. Click "Send Money"

**Option B: Using Wallet ID**
1. Toggle to "Enter Wallet ID"
2. Paste recipient's wallet ID
3. Follow steps 5-8 above

### 4. View Blockchain

1. Navigate to "Blockchain" page
2. See all blocks in chronological order
3. Click a block to expand transactions
4. Verify hashes and Proof-of-Work

### 5. Check UTXOs

1. Go to "UTXOs" page
2. View all unspent transaction outputs
3. See locked vs available UTXOs
4. Track which UTXOs are reserved for pending transactions

### 6. Generate Reports

1. Navigate to "Reports" page
2. View transaction statistics
3. Check Zakat deduction history
4. Export data as JSON
5. Trigger manual Zakat deduction (admin)

---

## 🔒 Security

### Implemented Security Measures

1. **Cryptographic Security**
   - RSA-2048 for digital signatures
   - SHA-256 for hashing
   - AES-256-CBC for private key encryption
   - Secure random number generation

2. **Authentication & Authorization**
   - JWT-based stateless authentication
   - OTP verification via email
   - Token expiration (24 hours)
   - Protected routes with middleware

3. **Database Security**
   - Indexed queries to prevent full table scans
   - Input validation and sanitization
   - Prepared statements (MongoDB driver)
   - Connection pooling

4. **Transaction Security**
   - Digital signature verification
   - Double-spend prevention via UTXO locking
   - Balance validation before transaction
   - Atomic database operations

5. **Network Security**
   - CORS configuration
   - Rate limiting (planned)
   - HTTPS in production
   - Environment variable secrets

### Security Best Practices

- Never share your private key
- Store private keys offline in cold storage
- Use strong, unique JWT secrets in production
- Rotate AES encryption keys periodically
- Enable 2FA on admin accounts
- Monitor system logs for suspicious activity
- Keep dependencies updated

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- **Go**: Follow [Effective Go](https://go.dev/doc/effective_go) guidelines
- **React**: Use functional components with hooks
- **Commits**: Use conventional commit messages
- **Documentation**: Update README for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Ibrahim Faisal** - *Initial work* - [ibrahim3702](https://github.com/ibrahim3702)

---

## 🙏 Acknowledgments

- Bitcoin whitepaper for UTXO model inspiration
- Ethereum for smart contract concepts
- MongoDB for excellent documentation
- React community for component patterns
- Go community for crypto libraries

---

## 📞 Support

For support, email ibrahimfaisal3702@gmail.com or open an issue on GitHub.

---

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ UTXO-based blockchain
- ✅ Proof-of-Work mining
- ✅ Digital signatures
- ✅ Automated Zakat
- ✅ Web interface

### Phase 2 (Planned)
- ⏳ Smart contracts
- ⏳ Multi-signature wallets
- ⏳ Lightning Network for scalability
- ⏳ Mobile app (React Native)
- ⏳ Hardware wallet support

### Phase 3 (Future)
- ⏳ Proof-of-Stake consensus
- ⏳ Privacy features (ZK-proofs)
- ⏳ Cross-chain bridges
- ⏳ DeFi protocols
- ⏳ DAO governance

---

## 📊 Project Statistics

- **Lines of Code**: ~10,000+
- **API Endpoints**: 50+
- **Database Collections**: 8
- **React Components**: 15+
- **Test Coverage**: In progress

---

## 🔗 Links

- **Live Demo**: [https://crypto-wallet-application-a9pg.vercel.app](https://crypto-wallet-application-a9pg.vercel.app)
- **Backend API**: [https://crypto-wallet-application.vercel.app](https://crypto-wallet-application.vercel.app)
- **GitHub**: [https://github.com/ibrahim3702/Crypto-Wallet-Application](https://github.com/ibrahim3702/Crypto-Wallet-Application)
- **Documentation**: [Research Article](./research-article.md)

---

**Built with ❤️ by Ibrahim Faisal**