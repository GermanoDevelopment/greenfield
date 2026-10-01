from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# Configuração otimizada de pooling de conexões
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,           # Aumentar o número de conexões
    max_overflow=30,        # Número máximo de conexões além do pool_size
    pool_recycle=3600,      # Reciclar conexões após 1 hora
    pool_timeout=30         # Tempo de espera para obter uma conexão
)

async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
