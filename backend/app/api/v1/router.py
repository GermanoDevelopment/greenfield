from fastapi import APIRouter

from app.api.v1 import admin, auth, bounties, health, projects, repositories, users, webhooks

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(repositories.router)
api_router.include_router(bounties.router)
api_router.include_router(admin.router)
api_router.include_router(webhooks.router)

