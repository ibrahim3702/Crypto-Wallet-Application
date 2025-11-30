package crypto

import (
	"crypto"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
)

// GenerateKeyPair generates a new RSA key pair (2048 bits)
func GenerateKeyPair() (*rsa.PrivateKey, *rsa.PublicKey, error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, nil, err
	}
	return privateKey, &privateKey.PublicKey, nil
}

// PrivateKeyToString converts private key to PEM encoded string
func PrivateKeyToString(privateKey *rsa.PrivateKey) string {
	privateKeyBytes := x509.MarshalPKCS1PrivateKey(privateKey)
	privateKeyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: privateKeyBytes,
	})
	return string(privateKeyPEM)
}

// PublicKeyToString converts public key to PEM encoded string
func PublicKeyToString(publicKey *rsa.PublicKey) (string, error) {
	publicKeyBytes, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		return "", err
	}
	publicKeyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PUBLIC KEY",
		Bytes: publicKeyBytes,
	})
	return string(publicKeyPEM), nil
}

// StringToPrivateKey converts PEM encoded string to private key
func StringToPrivateKey(privateKeyStr string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(privateKeyStr))
	if block == nil {
		return nil, errors.New("failed to decode PEM block containing private key")
	}
	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	return privateKey, nil
}

// StringToPublicKey converts PEM encoded string to public key
func StringToPublicKey(publicKeyStr string) (*rsa.PublicKey, error) {
	block, _ := pem.Decode([]byte(publicKeyStr))
	if block == nil {
		return nil, errors.New("failed to decode PEM block containing public key")
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	publicKey, ok := pub.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("not an RSA public key")
	}
	return publicKey, nil
}

// GenerateWalletID generates a wallet ID by hashing the public key
func GenerateWalletID(publicKeyStr string) string {
	hash := sha256.Sum256([]byte(publicKeyStr))
	return hex.EncodeToString(hash[:])
}

// SignData signs data with private key and returns base64 encoded signature
func SignData(data string, privateKeyStr string) (string, error) {
	privateKey, err := StringToPrivateKey(privateKeyStr)
	if err != nil {
		return "", err
	}

	// Hash the data
	hashed := sha256.Sum256([]byte(data))

	// Sign the hash
	signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hashed[:])
	if err != nil {
		return "", err
	}

	// Return base64 encoded signature
	return base64.StdEncoding.EncodeToString(signature), nil
}

// VerifySignature verifies a signature against data and public key
func VerifySignature(data string, signatureStr string, publicKeyStr string) error {
	publicKey, err := StringToPublicKey(publicKeyStr)
	if err != nil {
		return err
	}

	// Decode the signature from base64
	signature, err := base64.StdEncoding.DecodeString(signatureStr)
	if err != nil {
		return err
	}

	// Hash the data
	hashed := sha256.Sum256([]byte(data))

	// Verify the signature
	err = rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, hashed[:], signature)
	if err != nil {
		return errors.New("signature verification failed")
	}

	return nil
}

// CreateTransactionSignatureData creates the data string to be signed for a transaction
func CreateTransactionSignatureData(senderID, receiverID string, amount float64, timestamp int64, note string) string {
	return fmt.Sprintf("%s%s%.8f%d%s", senderID, receiverID, amount, timestamp, note)
}

// EncryptPrivateKey encrypts private key with AES for secure storage
func EncryptPrivateKey(privateKeyStr string, passphrase string) (string, error) {
	// Create a key from passphrase
	key := sha256.Sum256([]byte(passphrase))
	
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// Create nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// Encrypt
	ciphertext := gcm.Seal(nonce, nonce, []byte(privateKeyStr), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptPrivateKey decrypts an AES encrypted private key
func DecryptPrivateKey(encryptedPrivateKey string, passphrase string) (string, error) {
	// Create a key from passphrase
	key := sha256.Sum256([]byte(passphrase))
	
	// Decode from base64
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedPrivateKey)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// GenerateOTP generates a 6-digit OTP
func GenerateOTP() (string, error) {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	otp := int(b[0])<<16 | int(b[1])<<8 | int(b[2])
	otp = otp % 1000000
	return fmt.Sprintf("%06d", otp), nil
}

// HashPassword creates a SHA256 hash of a password (for OTP storage)
func HashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}
