package main

type CooldownConfig struct {
	Enabled          bool `json:"enabled"`
	FrequencySeconds int  `json:"frequency_seconds,omitempty"`
}

type CooldownForUser struct {
	CooldownConfig
	LastPostAt int64 `json:"last_post_at,omitempty"`
}
