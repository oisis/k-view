package contextutils

import (
	"context"
)

type contextKey int

const (
	UserKey contextKey = iota
)

// WithUser returns a new context with the user value.
func WithUser(ctx context.Context, user interface{}) context.Context {
	return context.WithValue(ctx, UserKey, user)
}

// GetUser returns the user value from the context.
func GetUser(ctx context.Context) (interface{}, bool) {
	val := ctx.Value(UserKey)
	return val, val != nil
}
