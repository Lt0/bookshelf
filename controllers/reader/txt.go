package reader

import (
	"time"
)

type txtInfo struct {
	Name     string
	ModTime  time.Time
	Words    int
	Chapters int
}
