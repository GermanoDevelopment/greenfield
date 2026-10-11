import asyncio
import logging

from sqlalchemy import select

from app.db.base import BountyModel, ProjectModel, RepositoryModel, UserModel
from app.db.session import async_session_factory

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("greenfield.seed")


async def seed_demo_data(session_factory=None) -> None:
    """Seeds non-privileged demo data for local development and demos."""
    if session_factory is None:
        session_factory = async_session_factory

    logger.info("Starting demo data seed...")

    async with session_factory() as session:
        # 1. Maintainer demo user
        res = await session.execute(
            select(UserModel).where(UserModel.username == "demo-maintainer")
        )
        maintainer = res.scalar_one_or_none()
        if not maintainer:
            maintainer = UserModel(
                username="demo-maintainer",
                email="maintainer@demo.greenfield.local",
                role="MAINTAINER",
                avatar_url="https://avatars.githubusercontent.com/u/9919?v=4",
                wallet="DemoMaintainer111111111111111111111111111111",
            )
            session.add(maintainer)
            await session.flush()
            logger.info("Created demo maintainer user (id: %d)", maintainer.id)
        else:
            logger.info("Demo maintainer already exists (id: %d)", maintainer.id)

        # 2. Contributor / Hunter demo user
        res = await session.execute(select(UserModel).where(UserModel.username == "demo-hunter"))
        hunter = res.scalar_one_or_none()
        if not hunter:
            hunter = UserModel(
                username="demo-hunter",
                email="hunter@demo.greenfield.local",
                role="CONTRIBUTOR",
                avatar_url="https://avatars.githubusercontent.com/u/9920?v=4",
                wallet="DemoHunter22222222222222222222222222222222",
            )
            session.add(hunter)
            await session.flush()
            logger.info("Created demo hunter user (id: %d)", hunter.id)
        else:
            logger.info("Demo hunter already exists (id: %d)", hunter.id)

        # 3. Demo Project
        res = await session.execute(
            select(ProjectModel).where(
                ProjectModel.github_repo == "GermanoDevelopment/greenfield-demo"
            )
        )
        project = res.scalar_one_or_none()
        if not project:
            project = ProjectModel(
                owner_id=maintainer.id,
                github_repo="GermanoDevelopment/greenfield-demo",
                description="Demo repository showcasing Solana USDC micro-bounties",
            )
            session.add(project)
            await session.flush()
            logger.info("Created demo project (id: %d)", project.id)
        else:
            logger.info("Demo project already exists (id: %d)", project.id)

        # 4. Demo Repository
        res = await session.execute(
            select(RepositoryModel).where(
                RepositoryModel.github_repo == "GermanoDevelopment/greenfield-demo"
            )
        )
        repo = res.scalar_one_or_none()
        if not repo:
            repo = RepositoryModel(
                project_id=project.id,
                github_owner="GermanoDevelopment",
                github_name="greenfield-demo",
                github_repo="GermanoDevelopment/greenfield-demo",
                github_repo_id=987654321,
                description="Demo repository showcasing Solana USDC micro-bounties",
                default_branch="main",
                is_active=True,
            )
            session.add(repo)
            await session.flush()
            logger.info("Created demo repository (id: %d)", repo.id)
        else:
            logger.info("Demo repository already exists (id: %d)", repo.id)

        # 5. Demo Open Bounty
        res = await session.execute(
            select(BountyModel).where(
                BountyModel.issue_url
                == "https://github.com/GermanoDevelopment/greenfield-demo/issues/1"
            )
        )
        bounty = res.scalar_one_or_none()
        if not bounty:
            bounty = BountyModel(
                project_id=project.id,
                repository_id=repo.id,
                issuer_id=maintainer.id,
                issue_url="https://github.com/GermanoDevelopment/greenfield-demo/issues/1",
                issue_number=1,
                issue_title="[demo] Implement client-side Solana transaction signing",
                issue_body="Sample open bounty for contributors to claim devnet USDC rewards.",
                amount_usdc=50000000,  # 50 USDC ($50.00) in micro-USDC
                points=100,
                status="OPEN",
            )
            session.add(bounty)
            await session.flush()
            logger.info("Created demo bounty (id: %d, amount: $50.00 USDC)", bounty.id)
        else:
            logger.info("Demo bounty already exists (id: %d)", bounty.id)

        await session.commit()
        logger.info("Demo data seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
