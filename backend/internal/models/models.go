package models

import (
	"time"
)

type BountyStatus string

const (
	BountyStatusOpen      BountyStatus = "OPEN"
	BountyStatusAssigned  BountyStatus = "ASSIGNED"
	BountyStatusSubmitted BountyStatus = "SUBMITTED"
	BountyStatusCompleted BountyStatus = "COMPLETED"
	BountyStatusCancelled BountyStatus = "CANCELLED"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	GitHubID  int64     `gorm:"uniqueIndex;not null" json:"github_id"`
	Username  string    `gorm:"size:255;not null" json:"username"`
	AvatarURL string    `gorm:"size:512" json:"avatar_url"`
	Wallet    string    `gorm:"size:44" json:"wallet"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Project struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OwnerID     uint      `gorm:"not null" json:"owner_id"`
	Owner       User      `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	GitHubRepo  string    `gorm:"size:255;not null" json:"github_repo"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Bounty struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	ProjectID   uint         `gorm:"not null" json:"project_id"`
	Project     Project      `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	IssuerID    uint         `gorm:"not null" json:"issuer_id"`
	Issuer      User         `gorm:"foreignKey:IssuerID" json:"issuer,omitempty"`
	HunterID    *uint        `json:"hunter_id,omitempty"`
	Hunter      *User        `gorm:"foreignKey:HunterID" json:"hunter,omitempty"`
	IssueURL    string       `gorm:"size:512;not null" json:"issue_url"`
	AmountUSDC  uint64       `gorm:"not null" json:"amount_usdc"`
	Status      BountyStatus `gorm:"size:32;default:'OPEN'" json:"status"`
	EscrowPDA   string       `gorm:"size:44" json:"escrow_pda"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}
