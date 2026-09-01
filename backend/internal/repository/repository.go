package repository

import (
	"github.com/GermanoDevelopment/greenfield/backend/internal/models"
	"gorm.io/gorm"
)

type Repository interface {
	GetUserByID(id uint) (*models.User, error)
	GetBounties() ([]models.Bounty, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *repository) GetBounties() ([]models.Bounty, error) {
	var bounties []models.Bounty
	if err := r.db.Find(&bounties).Error; err != nil {
		return nil, err
	}
	return bounties, nil
}
