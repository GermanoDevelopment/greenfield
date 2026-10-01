class DomainError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class NotFoundError(DomainError):
    def __init__(self, resource: str):
        super().__init__(404, f"{resource} not found")


class ForbiddenError(DomainError):
    def __init__(self, detail: str = "Not allowed"):
        super().__init__(403, detail)


class ConflictError(DomainError):
    def __init__(self, detail: str):
        super().__init__(409, detail)


class ValidationError(DomainError):
    def __init__(self, detail: str):
        super().__init__(422, detail)


class AuthenticationError(DomainError):
    def __init__(self, detail: str = "Credenciais inválidas"):
        super().__init__(401, detail)
