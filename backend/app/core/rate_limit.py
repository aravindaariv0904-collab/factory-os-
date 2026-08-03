import time
from fastapi import Request, HTTPException, status

class SlidingWindowRateLimiter:
    def __init__(self, requests_per_minute: int = 120):
        self.requests_per_minute = requests_per_minute
        self.requests = {}

    def is_rate_limited(self, ip: str) -> bool:
        now = time.time()
        minute_ago = now - 60

        if ip not in self.requests:
            self.requests[ip] = []

        # Filter requests older than 60s
        self.requests[ip] = [t for t in self.requests[ip] if t > minute_ago]

        if len(self.requests[ip]) >= self.requests_per_minute:
            return True

        self.requests[ip].append(now)
        return False

rate_limiter = SlidingWindowRateLimiter(requests_per_minute=120)

async def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    if rate_limiter.is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 120 requests per minute.",
        )
