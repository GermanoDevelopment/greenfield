import hashlib
import hmac
import json

from fastapi import APIRouter, Header, Request, Response
from sqlalchemy import select

from app.core.config import get_settings
from app.core.deps import DbSession
from app.db.base import BountyModel, UserModel
from app.schemas.bounty import BountyStatus
from app.services.bounty_service import complete_bounty, record_incoming_github_issue

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_signature(payload: bytes, signature_header: str | None) -> bool:
    secret = get_settings().github_webhook_secret
    if not secret:
        return True
    if not signature_header:
        return False
    expected = "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)


@router.post(
    "/github",
    summary="Webhook de eventos do GitHub",
)
async def github_webhook(
    request: Request,
    db: DbSession,
    response: Response,
    x_hub_signature_256: str | None = Header(None),
    x_github_event: str | None = Header(None),
) -> dict:
    """Recebe notificações de Pull Request (closed + merged) com validação de HMAC SHA-256.

    Ao detectar um PR mesclado com sucesso, auto-completa o bounty e dispara liquidação on-chain.
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

    if x_github_event == "ping":
        return {"detail": "pong"}

    if x_github_event == "pull_request":
        action = event.get("action")
        pr = event.get("pull_request", {})
        if action == "closed" and pr.get("merged") is True:
            pr_url = pr.get("html_url")
            result = await db.execute(
                select(BountyModel).where(
                    BountyModel.pr_url == pr_url,
                    BountyModel.status == BountyStatus.SUBMITTED.value,
                )
            )
            bounty = result.scalar_one_or_none()
            if bounty is not None:
                issuer = await db.get(UserModel, bounty.issuer_id)
                if issuer is not None:
                    await complete_bounty(db, bounty, issuer)
                    return {"detail": f"Bounty {bounty.id} completed"}

    if x_github_event == "issues":
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
