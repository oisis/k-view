package audit

import (
	"sync"
	"time"
)

type AuditEntry struct {
	Timestamp time.Time `json:"timestamp"`
	User      string    `json:"user"`
	Role      string    `json:"role"`
	Method    string    `json:"method"`
	Path      string    `json:"path"`
	Status    int       `json:"status"`
	Latency   string    `json:"latency"`
	IP        string    `json:"ip"`
	Payload   string    `json:"payload,omitempty"`
}

type AuditStore struct {
	entries []AuditEntry
	maxSize int
	mu      sync.RWMutex
}

var (
	globalStore *AuditStore
	once        sync.Once
)

func GetStore() *AuditStore {
	once.Do(func() {
		globalStore = &AuditStore{
			entries: make([]AuditEntry, 0, 100),
			maxSize: 100,
		}
	})
	return globalStore
}

func (s *AuditStore) Add(entry AuditEntry) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(s.entries) >= s.maxSize {
		// Remove oldest (first) entry
		s.entries = s.entries[1:]
	}
	s.entries = append(s.entries, entry)
}

func (s *AuditStore) GetEntries() []AuditEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Return a copy to avoid race conditions and allow reversing
	result := make([]AuditEntry, len(s.entries))
	copy(result, s.entries)

	// Reverse to show newest first
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	return result
}
