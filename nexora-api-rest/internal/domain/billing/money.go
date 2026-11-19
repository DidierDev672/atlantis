package billing

import (
	"math"
	"strings"
)

// Money represents a monetary amount in minor units (e.g. cents).
// Float64 is strictly forbidden inside the billing domain.
type Money int64

// MoneyFromMajorUnits converts a major-unit float (used by legacy Reserve/Stay/ServiceRequest modules)
// into minor units (cents) by rounding to the nearest integer cent.
func MoneyFromMajorUnits(amount float64) Money {
	return Money(math.Round(amount * 100))
}

// NormalizeCurrency trims and uppercases a 3-letter ISO currency code.
func NormalizeCurrency(raw string) (string, error) {
	c := strings.ToUpper(strings.TrimSpace(raw))
	if len(c) < 3 || len(c) > 5 {
		return "", ErrInvalidCurrency
	}
	return c, nil
}
