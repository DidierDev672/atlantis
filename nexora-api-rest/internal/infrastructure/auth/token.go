package auth

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"nexora-api-rest/internal/domain"
)

// defaultIssuer labels tokens produced by this service so another service can
// never validate/accept them.
const defaultIssuer = "nexora-api-rest"

// ErrInvalidToken indicates the JWT signature, issuer, or expiry check failed.
var ErrInvalidToken = errors.New("invalid or expired token")

// JWTTokenGenerator signs short-lived JWT access tokens with HS256. It is the
// security adapter of the TokenGenerator port (DIP: the signing algorithm and
// the secret are infrastructure concerns).
type JWTTokenGenerator struct {
	secret []byte
	issuer string
	ttl    time.Duration
}

// NewJWTTokenGenerator builds a signer with a fixed time-to-live. The secret
// must be high-entropy and is provided from configuration, never hardcoded.
func NewJWTTokenGenerator(secret string, ttl time.Duration) *JWTTokenGenerator {
	return &JWTTokenGenerator{
		secret: []byte(secret),
		issuer: defaultIssuer,
		ttl:    ttl,
	}
}

// GenerateForUser signs a token whose claims carry the user id as Subject and
// a short expiry. No personal data is embedded: the id is enough
// for the protected endpoints to reload the user.
func (g *JWTTokenGenerator) GenerateForUser(id domain.UserID) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   string(id),
		Issuer:    g.issuer,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(g.ttl)),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(g.secret)
	if err != nil {
		return "", err
	}
	return signed, nil
}

// ParseUserID validates a JWT token signed by this generator and returns the
// subject UserID.
func (g *JWTTokenGenerator) ParseUserID(tokenStr string) (domain.UserID, error) {
	tokenStr = strings.TrimSpace(tokenStr)
	if tokenStr == "" {
		return "", ErrInvalidToken
	}

	var claims jwt.RegisteredClaims
	parsed, err := jwt.ParseWithClaims(tokenStr, &claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return g.secret, nil
	}, jwt.WithIssuer(g.issuer))
	if err != nil || !parsed.Valid {
		return "", ErrInvalidToken
	}

	sub := strings.TrimSpace(claims.Subject)
	if sub == "" {
		return "", ErrInvalidToken
	}
	return domain.UserID(sub), nil
}
