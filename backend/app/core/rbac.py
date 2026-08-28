from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import List, Optional
from backend.app.core.security import SECRET_KEY, ALGORITHM

security = HTTPBearer()

class CurrentUser:
    def __init__(
        self,
        email: str,
        role: str,
        organization_id: Optional[str] = None,
        factory_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        self.email = email
        self.role = role
        self.organization_id = organization_id
        self.factory_id = factory_id
        self.user_id = user_id

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role", "Operator")
        organization_id: Optional[str] = payload.get("organization_id")
        factory_id: Optional[str] = payload.get("factory_id")
        user_id: Optional[str] = payload.get("user_id")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        return CurrentUser(
            email=email,
            role=role,
            organization_id=organization_id,
            factory_id=factory_id,
            user_id=user_id,
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate token credentials",
        )

def require_roles(allowed_roles: List[str]):
    def role_checker(user: CurrentUser = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{user.role}' is not authorized. Required: {allowed_roles}",
            )
        return user

    return role_checker
