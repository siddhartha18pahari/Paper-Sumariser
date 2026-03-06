from typing import Optional


class SessionStore:
    """
    In-memory store for user research context.

    Keyed by session_id (a string the frontend generates and sends with every request).
    In production you'd replace this with Redis or a database — but for a portfolio
    project, a plain dict is fine and much easier to reason about.
    """

    def __init__(self):
        self._store: dict[str, str] = {}

    def set(self, session_id: str, context: str) -> None:
        self._store[session_id] = context

    def get(self, session_id: str) -> Optional[str]:
        return self._store.get(session_id)

    def delete(self, session_id: str) -> None:
        self._store.pop(session_id, None)
