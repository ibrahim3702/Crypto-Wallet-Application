package auth

import (
	"crypto-wallet/config"
	"crypto-wallet/crypto"
	"crypto-wallet/db"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gopkg.in/gomail.v2"
)

// Claims represents JWT claims
type Claims struct {
	Email    string `json:"email"`
	WalletID string `json:"wallet_id"`
	UserID   string `json:"user_id"`
	jwt.RegisteredClaims
}

// GenerateJWT generates a JWT token for authenticated users
func GenerateJWT(email, walletID, userID string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	
	claims := &Claims{
		Email:    email,
		WalletID: walletID,
		UserID:   userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateJWT validates and parses a JWT token
func ValidateJWT(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// SendOTPEmail sends an OTP to the user's email
func SendOTPEmail(email, otp string) error {
	// Skip email sending if SMTP is not configured (for development)
	if config.AppConfig.SMTPUser == "" || config.AppConfig.SMTPPassword == "" {
		log.Printf("⚠️ SMTP not configured. OTP for %s: %s", email, otp)
		return nil
	}

	m := gomail.NewMessage()
	m.SetHeader("From", config.AppConfig.SMTPUser)
	m.SetHeader("To", email)
	m.SetHeader("Subject", "Your OTP for Crypto Wallet Login")
	
	body := fmt.Sprintf(`
		<html>
			<body>
				<h2>Crypto Wallet - OTP Verification</h2>
				<p>Your One-Time Password (OTP) is:</p>
				<h1 style="color: #4CAF50; font-size: 32px;">%s</h1>
				<p>This OTP is valid for 10 minutes.</p>
				<p>If you did not request this OTP, please ignore this email.</p>
			</body>
		</html>
	`, otp)
	
	m.SetBody("text/html", body)

	d := gomail.NewDialer(
		config.AppConfig.SMTPHost,
		config.AppConfig.SMTPPort,
		config.AppConfig.SMTPUser,
		config.AppConfig.SMTPPassword,
	)

	if err := d.DialAndSend(m); err != nil {
		log.Printf("Error sending email: %v", err)
		return err
	}

	log.Printf("✅ OTP sent to %s", email)
	return nil
}

// GenerateAndSendOTP generates an OTP and sends it to the user
func GenerateAndSendOTP(email string) error {
	// Generate OTP
	otp, err := crypto.GenerateOTP()
	if err != nil {
		return err
	}

	// Hash OTP for storage
	hashedOTP := crypto.HashPassword(otp)

	// Set OTP expiry (10 minutes)
	expiry := time.Now().Add(10 * time.Minute)

	// Update user with OTP
	err = db.UpdateUser(email, map[string]interface{}{
		"otp":        hashedOTP,
		"otp_expiry": expiry,
	})
	if err != nil {
		return err
	}

	// Send OTP via email
	err = SendOTPEmail(email, otp)
	if err != nil {
		return err
	}

	return nil
}

// VerifyOTP verifies the OTP provided by the user
func VerifyOTP(email, otp string) error {
	// Get user
	user, err := db.GetUserByEmail(email)
	if err != nil {
		return errors.New("user not found")
	}

	// Check if OTP exists
	if user.OTP == "" {
		return errors.New("no OTP found for this user")
	}

	// Check if OTP has expired
	if time.Now().After(user.OTPExpiry) {
		return errors.New("OTP has expired")
	}

	// Hash the provided OTP
	hashedOTP := crypto.HashPassword(otp)

	// Verify OTP
	if hashedOTP != user.OTP {
		return errors.New("invalid OTP")
	}

	// Mark email as verified and clear OTP
	err = db.UpdateUser(email, map[string]interface{}{
		"is_email_verified": true,
		"otp":               "",
		"otp_expiry":        time.Time{},
		"last_login":        time.Now(),
	})
	if err != nil {
		return err
	}

	return nil
}

// ResendOTP resends the OTP to the user
func ResendOTP(email string) error {
	// Check if user exists
	_, err := db.GetUserByEmail(email)
	if err != nil {
		return errors.New("user not found")
	}

	// Generate and send new OTP
	return GenerateAndSendOTP(email)
}
