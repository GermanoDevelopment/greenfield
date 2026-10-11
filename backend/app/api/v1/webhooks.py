import hashlib
import hmac
import json

from fastapi import APIRouter, Depends, Header, Request, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import DbSession
from app.core.exceptions import DomainError
from app.core.rate_limit import webhook_rate_limit
from app.db.base import BountyModel, UserModel, WebhookDeliveryModel
from app.schemas.bounty import BountyStatus
from app.services.bounty_service import complete_bounty, record_incoming_github_issue

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_signature(payload: bytes, signature_header: str | None) -> bool:
    secret = get_settings().github_webhook_secret
    if not secret:
        return False
    if not signature_header:
        return False
    expected = "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)


@router.post(
    "/github",
    dependencies=[Depends(webhook_rate_limit)],
    summary="Webhook de eventos do GitHub",
)
async def github_webhook(
    request: Request,
    db: DbSession,
    response: Response,
    x_hub_signature_256: str | None = Header(None),
    x_github_event: str | None = Header(None),
    x_github_delivery: str | None = Header(None),
) -> dict:
    """Recebe notificações de Pull Request (closed + merged) com validação de HMAC SHA-256.

    Ao detectar um PR mesclado com sucesso, auto-completa o bounty e dispara liquidação on-chain.
    Entregas repetidas (mesmo `X-GitHub-Delivery`) são ignoradas.
    """
    payload = await request.body()
    if not _verify_signature(payload, x_hub_signature_256):
        response.status_code = 403
        return {"detail": "Invalid signature"}

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        response.status_code = 400
        return {"detail": "Invalid JSON payload"}

    if x_github_delivery and await db.get(WebhookDeliveryModel, x_github_delivery):
        return {"detail": "Duplicate delivery ignored"}

    result = await _handle_event(db, x_github_event, event)

    if x_github_delivery:
        db.add(WebhookDeliveryModel(delivery_id=x_github_delivery, event=x_github_event))
        try:
            await db.commit()
        except IntegrityError:
            # A concurrent copy of the same delivery got recorded first.
            await db.rollback()
    return result


async def _handle_event(db: AsyncSession, event_name: str | None, event: dict) -> dict:
    if event_name == "ping":
        return {"detail": "pong"}

    if event_name == "pull_request":
        action = event.get("action")
        pr = event.get("pull_request", {})
        if action == "closed" and pr.get("merged") is True:
            pr_url = pr.get("html_url")
            result = await db.execute(
                select(BountyModel).where(
                    BountyModel.pr_url == pr_url,
                    BountyModel.status.in_(
                        [BountyStatus.SUBMITTED.value, BountyStatus.CLAIM_FAILED.value]
                    ),
                )
            )
            bounty = result.scalar_one_or_none()
            if bounty is not None:
                bounty_id = bounty.id
                issuer = await db.get(UserModel, bounty.issuer_id)
                if issuer is not None:
                    try:
                        await complete_bounty(db, bounty, issuer)
                    except DomainError as e:
                        await db.rollback()
                        return {"detail": f"Bounty {bounty_id} not completed: {e.detail}"}
                    return {"detail": f"Bounty {bounty_id} completed"}

    if event_name == "issues":
        action = event.get("action", "")
        issue_data = event.get("issue", {})
        repo_data = event.get("repository", {})
        repo_full_name = repo_data.get("full_name") or (
            f"{repo_data.get('owner', {}).get('login')}/{repo_data.get('name')}"
            if repo_data.get("name")
            else None
        )

        if repo_full_name and issue_data:
            tracked = await record_incoming_github_issue(
                session=db,
                repo_full_name=repo_full_name,
                issue_data=issue_data,
                action=action,
            )
            if tracked is not None:
                return {
                    "detail": f"Issue #{tracked.issue_number} recorded (action: {action})",
                    "issue_id": tracked.id,
                }

    return {"detail": "Event ignored"}
