import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TrackedIssueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    repository_id: int
    issue_number: int
    title: str
    body: str | None = None
    html_url: str
    author_username: str | None = None
    labels: list[str] = Field(default_factory=list)
    state: str = "open"
    has_bounty: bool = False
    bounty_id: int | None = None
    created_at: datetime
    repository_name: str | None = None

    @classmethod
    def from_model(cls, model, repo_name: str | None = None) -> "TrackedIssueOut":
        parsed_labels: list[str] = []
        if model.labels:
            try:
                parsed_labels = json.loads(model.labels)
            except Exception:
                parsed_labels = [s.strip() for s in model.labels.split(",") if s.strip()]

        return cls(
            id=model.id,
            project_id=model.project_id,
            repository_id=model.repository_id,
            issue_number=model.issue_number,
            title=model.title,
            body=model.body,
            html_url=model.html_url,
            author_username=model.author_username,
            labels=parsed_labels,
            state=model.state,
            has_bounty=model.has_bounty,
            bounty_id=model.bounty_id,
            created_at=model.created_at,
            repository_name=repo_name or getattr(model.repository, "github_repo", None),
        )


class AssignRewardRequest(BaseModel):
    points: int = Field(
        ...,
        ge=1,
        description="Pontuação atribuída à issue (conversão canônica: 100 Pontos = $1 USDC).",
    )
