import logging
from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


class HealthOut(BaseModel):
    status: str = Field(description="Operational status of the API", examples=["healthy"])
    service: str = Field(description="Service name", examples=["greenfield-backend"])
    database: str = Field(
        default="connected", description="Database connection status", examples=["connected"]
    )


@router.get(
    "/health",
    response_model=HealthOut,
    summary="Health check da API e Banco de Dados",
    description="Verifica se o FastAPI e a conexão com o banco de dados estão operacionais.",
    responses={
        200: {"model": HealthOut, "description": "Serviço e banco saudáveis"},
        503: {"description": "Banco de dados indisponível ou falha operacional"},
    },
)
async def health_check(db: Annotated[AsyncSession, Depends(get_db)]):
    try:
        await db.execute(text("SELECT 1"))
        return HealthOut(status="healthy", service="greenfield-backend", database="connected")
    except Exception as e:
        logger.error("Database health check failed: %s", e)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "greenfield-backend",
                "database": "disconnected",
                "detail": "Database readiness probe failed",
            },
        )


@router.get(
    "/health/live",
    response_model=HealthOut,
    summary="Liveness probe",
    description="Verifica apenas se o processo do backend está ativo e respondendo.",
)
async def liveness_check() -> HealthOut:
    return HealthOut(status="healthy", service="greenfield-backend", database="unmonitored")
