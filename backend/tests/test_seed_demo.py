from sqlalchemy import select

from app.db.base import BountyModel, ProjectModel, RepositoryModel, UserModel
from app.db.seed_demo import seed_demo_data


async def test_seed_demo_data_is_idempotent(session_factory):
    # Run seed once
    await seed_demo_data(session_factory=session_factory)

    async with session_factory() as session:
        maintainer = (
            await session.execute(select(UserModel).where(UserModel.username == "demo-maintainer"))
        ).scalar_one()
        hunter = (
            await session.execute(select(UserModel).where(UserModel.username == "demo-hunter"))
        ).scalar_one()
        project = (
            await session.execute(
                select(ProjectModel).where(
                    ProjectModel.github_repo == "GermanoDevelopment/greenfield-demo"
                )
            )
        ).scalar_one()
        repo = (
            await session.execute(
                select(RepositoryModel).where(
                    RepositoryModel.github_repo == "GermanoDevelopment/greenfield-demo"
                )
            )
        ).scalar_one()
        bounty = (
            await session.execute(select(BountyModel).where(BountyModel.project_id == project.id))
        ).scalar_one()

        assert maintainer.role == "MAINTAINER"
        assert hunter.role == "CONTRIBUTOR"
        assert project.owner_id == maintainer.id
        assert repo.project_id == project.id
        assert bounty.amount_usdc == 50000000
        assert bounty.status == "OPEN"

    # Run seed second time (idempotency test)
    await seed_demo_data(session_factory=session_factory)

    async with session_factory() as session:
        users_count = len(
            (
                await session.execute(
                    select(UserModel).where(
                        UserModel.username.in_(["demo-maintainer", "demo-hunter"])
                    )
                )
            )
            .scalars()
            .all()
        )
        assert users_count == 2
