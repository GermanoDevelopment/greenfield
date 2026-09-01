package services

import (
	"context"

	"github.com/GermanoDevelopment/greenfield/backend/internal/models"
	"github.com/GermanoDevelopment/greenfield/backend/internal/repository"
)

type GitHubService interface {
	VerifyIssue(ctx context.Context, owner, repo string, issueNumber int) (bool, error)
}

type SolanaService interface {
	VerifyEscrow(ctx context.Context, escrowAddress string, expectedAmount uint64) (bool, error)
}

type BountyService struct {
	repo    repository.Repository
	github  GitHubService
	solana  SolanaService
}

func NewBountyService(repo repository.Repository, gh GitHubService, sol SolanaService) *BountyService {
	return &BountyService{
		repo:   repo,
		github: gh,
		solana: sol,
	}
}

func (s *BountyService) ListBounties(ctx context.Context) ([]models.Bounty, error) {
	return s.repo.GetBounties()
}
