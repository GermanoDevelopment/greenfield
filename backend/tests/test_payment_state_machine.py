from unittest.mock import AsyncMock, patch

import pytest

from app.db.base import BountyModel, ProjectModel, RepositoryModel, UserModel
from app.schemas.bounty import BOUNTY_TRANSITIONS, BountyStatus
from app.services import bounty_service, solana_service


def test_bounty_status_enum_and_transitions():
    assert BountyStatus.CLAIMABLE == "CLAIMABLE"
    assert BountyStatus.CLAIMED == "CLAIMED"
    assert BountyStatus.CLAIM_FAILED == "CLAIM_FAILED"

    assert BountyStatus.CLAIMABLE in BOUNTY_TRANSITIONS[BountyStatus.SUBMITTED]
    assert BountyStatus.CLAIM_FAILED in BOUNTY_TRANSITIONS[BountyStatus.SUBMITTED]

    assert BountyStatus.CLAIMED in BOUNTY_TRANSITIONS[BountyStatus.CLAIMABLE]
    assert BountyStatus.CLAIM_FAILED in BOUNTY_TRANSITIONS[BountyStatus.CLAIMABLE]

    assert BountyStatus.CLAIMABLE in BOUNTY_TRANSITIONS[BountyStatus.CLAIM_FAILED]
    assert BountyStatus.CLAIMED in BOUNTY_TRANSITIONS[BountyStatus.CLAIM_FAILED]
    assert BountyStatus.ASSIGNED in BOUNTY_TRANSITIONS[BountyStatus.CLAIM_FAILED]


@pytest.mark.asyncio
async def test_merged_pr_moves_to_claimable_onchain(db_session):
    owner = UserModel(github_id=1, username="owner", role="MAINTAINER")
    hunter = UserModel(
        github_id=2,
        username="hunter",
        role="CONTRIBUTOR",
        wallet="11111111111111111111111111111111",
    )
    db_session.add_all([owner, hunter])
    await db_session.flush()

    project = ProjectModel(owner_id=owner.id, github_repo="org/repo")
    db_session.add(project)
    await db_session.flush()

    repo = RepositoryModel(
        project_id=project.id,
        github_owner="org",
        github_name="repo",
        github_repo="org/repo",
    )
    db_session.add(repo)
    await db_session.flush()

    bounty = BountyModel(
        project_id=project.id,
        repository_id=repo.id,
        issuer_id=owner.id,
        hunter_id=hunter.id,
        issue_url="https://github.com/org/repo/issues/10",
        issue_number=10,
        amount_usdc=5000000,
        status=BountyStatus.SUBMITTED.value,
        pr_url="https://github.com/org/repo/pull/20",
    )
    db_session.add(bounty)
    await db_session.commit()

    pr_payload = {
        "merged": True,
        "base_repo": repo.github_repo,
        "author_id": hunter.github_id,
        "title": "Fix bug #10",
        "body": "Resolves #10",
    }

    with patch.object(bounty_service, "_fetch_pr_or_conflict", AsyncMock(return_value=pr_payload)):
        with patch.object(solana_service, "is_onchain_enabled", return_value=True):
            with patch.object(
                solana_service, "approve_claim_onchain", AsyncMock(return_value="tx_approve")
            ):
                completed = await bounty_service.complete_bounty(db_session, bounty, owner)
                assert completed.status == BountyStatus.CLAIMABLE.value
                assert completed.tx_signature is None
                assert completed.failure_reason is None


@pytest.mark.asyncio
async def test_merged_pr_onchain_approval_error_surfaces_as_claim_failed(db_session):
    owner = UserModel(github_id=10, username="owner2", role="MAINTAINER")
    hunter = UserModel(
        github_id=20,
        username="hunter2",
        role="CONTRIBUTOR",
        wallet="11111111111111111111111111111111",
    )
    db_session.add_all([owner, hunter])
    await db_session.flush()

    project = ProjectModel(owner_id=owner.id, github_repo="org/repo2")
    db_session.add(project)
    await db_session.flush()

    repo = RepositoryModel(
        project_id=project.id,
        github_owner="org",
        github_name="repo2",
        github_repo="org/repo2",
    )
    db_session.add(repo)
    await db_session.flush()

    bounty = BountyModel(
        project_id=project.id,
        repository_id=repo.id,
        issuer_id=owner.id,
        hunter_id=hunter.id,
        issue_url="https://github.com/org/repo2/issues/10",
        issue_number=10,
        amount_usdc=5000000,
        status=BountyStatus.SUBMITTED.value,
        pr_url="https://github.com/org/repo2/pull/20",
    )
    db_session.add(bounty)
    await db_session.commit()

    pr_payload = {
        "merged": True,
        "base_repo": repo.github_repo,
        "author_id": hunter.github_id,
        "title": "Fix #10",
        "body": "Resolves #10",
    }

    with patch.object(bounty_service, "_fetch_pr_or_conflict", AsyncMock(return_value=pr_payload)):
        with patch.object(solana_service, "is_onchain_enabled", return_value=True):
            with patch.object(
                solana_service,
                "approve_claim_onchain",
                AsyncMock(side_effect=solana_service.SolanaServiceError("RPC node timeout")),
            ):
                completed = await bounty_service.complete_bounty(db_session, bounty, owner)
                assert completed.status == BountyStatus.CLAIM_FAILED.value
                assert completed.failure_reason == "On-chain approval failed: RPC node timeout"


@pytest.mark.asyncio
async def test_custodial_payout_failure_surfaces_as_claim_failed(db_session):
    owner = UserModel(github_id=30, username="owner3", role="MAINTAINER")
    hunter = UserModel(
        github_id=40,
        username="hunter3",
        role="CONTRIBUTOR",
        wallet="11111111111111111111111111111111",
    )
    db_session.add_all([owner, hunter])
    await db_session.flush()

    project = ProjectModel(owner_id=owner.id, github_repo="org/repo3")
    db_session.add(project)
    await db_session.flush()

    repo = RepositoryModel(
        project_id=project.id,
        github_owner="org",
        github_name="repo3",
        github_repo="org/repo3",
    )
    db_session.add(repo)
    await db_session.flush()

    bounty = BountyModel(
        project_id=project.id,
        repository_id=repo.id,
        issuer_id=owner.id,
        hunter_id=hunter.id,
        issue_url="https://github.com/org/repo3/issues/10",
        issue_number=10,
        amount_usdc=5000000,
        status=BountyStatus.SUBMITTED.value,
        pr_url="https://github.com/org/repo3/pull/20",
    )
    db_session.add(bounty)
    await db_session.commit()

    pr_payload = {
        "merged": True,
        "base_repo": repo.github_repo,
        "author_id": hunter.github_id,
        "title": "Fix #10",
        "body": "Resolves #10",
    }

    with patch.object(bounty_service, "_fetch_pr_or_conflict", AsyncMock(return_value=pr_payload)):
        with patch.object(solana_service, "is_onchain_enabled", return_value=False):
            with patch.object(
                solana_service,
                "execute_bounty_payout",
                AsyncMock(side_effect=Exception("Insufficient treasury balance")),
            ):
                completed = await bounty_service.complete_bounty(db_session, bounty, owner)
                assert completed.status == BountyStatus.CLAIM_FAILED.value
                assert completed.failure_reason == "Payout failed: Insufficient treasury balance"


@pytest.mark.asyncio
async def test_custodial_hunter_without_wallet_stays_claimable(db_session):
    owner = UserModel(github_id=50, username="owner4", role="MAINTAINER")
    hunter = UserModel(github_id=60, username="hunter4", role="CONTRIBUTOR", wallet=None)
    db_session.add_all([owner, hunter])
    await db_session.flush()

    project = ProjectModel(owner_id=owner.id, github_repo="org/repo4")
    db_session.add(project)
    await db_session.flush()

    repo = RepositoryModel(
        project_id=project.id,
        github_owner="org",
        github_name="repo4",
        github_repo="org/repo4",
    )
    db_session.add(repo)
    await db_session.flush()

    bounty = BountyModel(
        project_id=project.id,
        repository_id=repo.id,
        issuer_id=owner.id,
        hunter_id=hunter.id,
        issue_url="https://github.com/org/repo4/issues/10",
        issue_number=10,
        amount_usdc=5000000,
        status=BountyStatus.SUBMITTED.value,
        pr_url="https://github.com/org/repo4/pull/20",
    )
    db_session.add(bounty)
    await db_session.commit()

    pr_payload = {
        "merged": True,
        "base_repo": repo.github_repo,
        "author_id": hunter.github_id,
        "title": "Fix #10",
        "body": "Resolves #10",
    }

    with patch.object(bounty_service, "_fetch_pr_or_conflict", AsyncMock(return_value=pr_payload)):
        with patch.object(solana_service, "is_onchain_enabled", return_value=False):
            completed = await bounty_service.complete_bounty(db_session, bounty, owner)
            assert completed.status == BountyStatus.CLAIMABLE.value
            assert completed.tx_signature is None
            assert completed.failure_reason is None


@pytest.mark.asyncio
async def test_record_claim_transitions_to_claimed(db_session):
    owner = UserModel(github_id=70, username="owner5", role="MAINTAINER")
    hunter = UserModel(
        github_id=80,
        username="hunter5",
        role="CONTRIBUTOR",
        wallet="11111111111111111111111111111111",
    )
    db_session.add_all([owner, hunter])
    await db_session.flush()

    project = ProjectModel(owner_id=owner.id, github_repo="org/repo5")
    db_session.add(project)
    await db_session.flush()

    bounty = BountyModel(
        project_id=project.id,
        issuer_id=owner.id,
        hunter_id=hunter.id,
        issue_url="https://github.com/org/repo5/issues/10",
        issue_number=10,
        amount_usdc=5000000,
        status=BountyStatus.CLAIMABLE.value,
    )
    db_session.add(bounty)
    await db_session.commit()

    with patch.object(solana_service, "is_onchain_enabled", return_value=True):
        with patch.object(
            solana_service,
            "get_bounty_account",
            AsyncMock(return_value={"status": solana_service.BOUNTY_STATUS_CLAIMED}),
        ):
            claimed = await bounty_service.record_claim(
                db_session, bounty, hunter, "sig_tx_confirmed_12345"
            )
            assert claimed.status == BountyStatus.CLAIMED.value
            assert claimed.tx_signature == "sig_tx_confirmed_12345"
            assert claimed.claimed_at is not None
            assert claimed.failure_reason is None
