from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(tags=["health"])


class HealthOut(BaseModel):
    status: str = Field(description="Status operacional da API", examples=["healthy"])
    service: str = Field(description="Nome do serviço", examples=["greenfield-backend"])


@router.get(
    "/health",
    response_model=HealthOut,
    summary="Health check da API",
    description="Verifica se o serviço FastAPI está operacional e apto a receber requisições.",
)
async def health_check() -> HealthOut:
    return HealthOut(status="healthy", service="greenfield-backend")
