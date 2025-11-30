package handlers

import (
	"crypto-wallet/auth"
	"crypto-wallet/crypto"
	"crypto-wallet/db"
	"crypto-wallet/middleware"
	"crypto-wallet/models"
	"crypto-wallet/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// Signup handles user registration
func Signup(c *gin.Context) {
	var req models.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := middleware.GetClientIP(c)

	// Check if user already exists
	existingUser, _ := db.GetUserByEmail(req.Email)
	if existingUser != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User with this email already exists"})
		return
	}

	// Generate RSA key pair
	privateKey, publicKey, err := crypto.GenerateKeyPair()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate keys"})
		return
	}

	// Convert keys to strings
	privateKeyStr := crypto.PrivateKeyToString(privateKey)
	publicKeyStr, err := crypto.PublicKeyToString(publicKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert public key"})
		return
	}

	// Generate wallet ID from public key
	walletID := crypto.GenerateWalletID(publicKeyStr)

	// Encrypt private key with user's email as passphrase (in production, use a better method)
	encryptedPrivateKey, err := crypto.EncryptPrivateKey(privateKeyStr, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt private key"})
		return
	}

	// Create user
	user := models.User{
		FullName:            req.FullName,
		Email:               req.Email,
		CNIC:                req.CNIC,
		WalletID:            walletID,
		PublicKey:           publicKeyStr,
		EncryptedPrivateKey: encryptedPrivateKey,
		IsEmailVerified:     false,
		Beneficiaries:       []string{},
	}

	err = db.CreateUser(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Create wallet
	wallet := models.Wallet{
		WalletID:  walletID,
		UserID:    user.ID,
		PublicKey: publicKeyStr,
		Balance:   0.0,
	}

	err = db.CreateWallet(&wallet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create wallet"})
		return
	}

	// Generate and send OTP
	err = auth.GenerateAndSendOTP(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
		return
	}

	// Log signup
	services.LogSignup(user.ID, user.Email, ipAddress)
	services.LogOTPGenerated(user.Email, ipAddress)

	c.JSON(http.StatusCreated, gin.H{
		"message":   "User created successfully. Please verify your email with the OTP sent.",
		"wallet_id": walletID,
		"email":     req.Email,
	})
}

// Login handles user login (sends OTP)
func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := middleware.GetClientIP(c)

	// Check if user exists
	user, err := db.GetUserByEmail(req.Email)
	if err != nil {
		services.LogFailedLogin(req.Email, ipAddress, "user not found")
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Generate and send OTP
	err = auth.GenerateAndSendOTP(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
		return
	}

	services.LogOTPGenerated(user.Email, ipAddress)

	c.JSON(http.StatusOK, gin.H{
		"message": "OTP sent to your email",
		"email":   req.Email,
	})
}

// VerifyOTP handles OTP verification and returns JWT token
func VerifyOTP(c *gin.Context) {
	var req models.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := middleware.GetClientIP(c)

	// Verify OTP
	err := auth.VerifyOTP(req.Email, req.OTP)
	if err != nil {
		services.LogFailedOTP(req.Email, ipAddress)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Get user
	user, err := db.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Generate JWT token
	token, err := auth.GenerateJWT(user.Email, user.WalletID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	services.LogOTPVerified(user.ID, user.Email, ipAddress)
	services.LogLogin(user.ID, user.Email, ipAddress)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Login successful",
		"token":     token,
		"user": gin.H{
			"id":         user.ID,
			"full_name":  user.FullName,
			"email":      user.Email,
			"wallet_id":  user.WalletID,
			"public_key": user.PublicKey,
		},
	})
}

// ResendOTP resends OTP to user's email
func ResendOTP(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := middleware.GetClientIP(c)

	err := auth.ResendOTP(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	services.LogOTPGenerated(req.Email, ipAddress)

	c.JSON(http.StatusOK, gin.H{"message": "OTP resent successfully"})
}

// GetProfile returns the authenticated user's profile
func GetProfile(c *gin.Context) {
	email, _, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := db.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":                user.ID,
			"full_name":         user.FullName,
			"email":             user.Email,
			"cnic":              user.CNIC,
			"wallet_id":         user.WalletID,
			"public_key":        user.PublicKey,
			"is_email_verified": user.IsEmailVerified,
			"beneficiaries":     user.Beneficiaries,
			"created_at":        user.CreatedAt,
			"last_login":        user.LastLogin,
		},
	})
}

// UpdateProfile updates user profile information
func UpdateProfile(c *gin.Context) {
	email, _, userID, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := middleware.GetClientIP(c)

	// Prepare update
	update := bson.M{}
	
	if req.FullName != "" {
		update["full_name"] = req.FullName
	}

	if req.Email != "" && req.Email != email {
		// Check if new email already exists
		existingUser, _ := db.GetUserByEmail(req.Email)
		if existingUser != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
			return
		}
		
		update["email"] = req.Email
		update["is_email_verified"] = false
		
		// Send OTP to new email
		auth.GenerateAndSendOTP(req.Email)
	}

	if len(update) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	err := db.UpdateUser(email, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	services.LogSystemEventWithIP("profile_updated", userID, ipAddress, map[string]interface{}{
		"fields": update,
	}, "info")

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// AddBeneficiary adds a wallet ID to beneficiaries list
func AddBeneficiary(c *gin.Context) {
	email, _, userID, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.AddBeneficiaryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate wallet exists
	if !db.WalletExists(req.WalletID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid wallet ID"})
		return
	}

	// Get user
	user, err := db.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if already exists
	for _, beneficiary := range user.Beneficiaries {
		if beneficiary == req.WalletID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Beneficiary already added"})
			return
		}
	}

	// Add beneficiary
	user.Beneficiaries = append(user.Beneficiaries, req.WalletID)
	
	err = db.UpdateUser(email, bson.M{"beneficiaries": user.Beneficiaries})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add beneficiary"})
		return
	}

	services.LogSystemEvent("beneficiary_added", userID, map[string]interface{}{
		"beneficiary_wallet_id": req.WalletID,
	}, "info")

	c.JSON(http.StatusOK, gin.H{
		"message":       "Beneficiary added successfully",
		"beneficiaries": user.Beneficiaries,
	})
}

// RemoveBeneficiary removes a wallet ID from beneficiaries list
func RemoveBeneficiary(c *gin.Context) {
	email, _, userID, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	walletID := c.Param("walletId")

	// Get user
	user, err := db.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Remove beneficiary
	var newBeneficiaries []string
	found := false
	for _, beneficiary := range user.Beneficiaries {
		if beneficiary != walletID {
			newBeneficiaries = append(newBeneficiaries, beneficiary)
		} else {
			found = true
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Beneficiary not found"})
		return
	}

	err = db.UpdateUser(email, bson.M{"beneficiaries": newBeneficiaries})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove beneficiary"})
		return
	}

	services.LogSystemEvent("beneficiary_removed", userID, map[string]interface{}{
		"beneficiary_wallet_id": walletID,
	}, "info")

	c.JSON(http.StatusOK, gin.H{
		"message":       "Beneficiary removed successfully",
		"beneficiaries": newBeneficiaries,
	})
}

// GetPrivateKey returns the encrypted private key (user must provide email as passphrase to decrypt)
func GetPrivateKey(c *gin.Context) {
	email, _, _, exists := middleware.GetUserContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := db.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"encrypted_private_key": user.EncryptedPrivateKey,
		"note":                  "Decrypt this with your email as the passphrase",
	})
}
