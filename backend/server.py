from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone, timedelta

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

# Password utils
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# Token utils
def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth dependency
async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Type de token invalide")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# App setup
app = FastAPI(title="R2A Industrie - Gestion de Stock")
api_router = APIRouter(prefix="/api")

# Models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: Optional[str] = "employee"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: Optional[str] = None

# ============ AUTH ROUTES ============

@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request):
    email = req.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        lock_until = attempt.get("locked_until")
        if lock_until and datetime.now(timezone.utc) < lock_until:
            raise HTTPException(status_code=429, detail="Trop de tentatives. Réessayez dans 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": datetime.now(timezone.utc) + timedelta(minutes=15)}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    await db.login_attempts.delete_many({"identifier": identifier})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    await log_activity(user_id, "login", "Connexion réussie")

    return {
        "id": user_id, "email": user["email"],
        "name": user.get("name", ""), "role": user.get("role", "employee"),
        "access_token": access_token, "refresh_token": refresh_token
    }

@api_router.post("/auth/register")
async def register(req: RegisterRequest):
    email = req.email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    user_doc = {
        "email": email,
        "password_hash": hash_password(req.password),
        "name": req.name.strip(),
        "role": req.role if req.role in ["admin", "employee"] else "employee",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)

    return {
        "id": user_id, "email": email, "name": req.name.strip(), "role": user_doc["role"],
        "access_token": access_token, "refresh_token": refresh_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "id": user["_id"], "email": user["email"],
        "name": user.get("name", ""), "role": user.get("role", "employee")
    }

@api_router.post("/auth/logout")
async def logout():
    return {"message": "Déconnecté"}

class RefreshRequest(BaseModel):
    refresh_token: str

@api_router.post("/auth/refresh")
async def refresh_token_endpoint(req: RefreshRequest):
    try:
        payload = jwt.decode(req.refresh_token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Type de token invalide")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        user_id = str(user["_id"])
        new_access = create_access_token(user_id, user["email"])
        return {"access_token": new_access}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ============ DASHBOARD ROUTES ============

PRODUCT_CATEGORIES = [
    {"id": "hydraulique", "name": "Hydraulique", "icon": "Droplets"},
    {"id": "pneumatique", "name": "Pneumatique", "icon": "Wind"},
    {"id": "electrique", "name": "Électrique", "icon": "Zap"},
    {"id": "automatisme", "name": "Automatisme", "icon": "Cpu"},
    {"id": "roulements", "name": "Roulements", "icon": "CircleDashed"},
    {"id": "moteurs", "name": "Moteurs", "icon": "Settings"},
    {"id": "capteurs", "name": "Capteurs", "icon": "Radio"},
    {"id": "variateurs", "name": "Variateurs", "icon": "SlidersHorizontal"},
    {"id": "outillage", "name": "Outillage", "icon": "Wrench"},
    {"id": "quincaillerie", "name": "Quincaillerie", "icon": "Hammer"},
    {"id": "securite", "name": "Sécurité", "icon": "ShieldCheck"},
    {"id": "maintenance", "name": "Maintenance", "icon": "HardHat"},
]

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    await get_current_user(request)

    total_products = await db.products.count_documents({"archived": {"$ne": True}})
    low_stock = await db.products.count_documents({
        "archived": {"$ne": True},
        "$expr": {"$lte": ["$quantity", "$stock_minimum"]}
    })
    out_of_stock = await db.products.count_documents({
        "archived": {"$ne": True},
        "quantity": 0
    })

    # Monthly sales
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_sales_cursor = db.sales.aggregate([
        {"$match": {"created_at": {"$gte": month_start.isoformat()}, "archived": {"$ne": True}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}, "count": {"$sum": 1}}}
    ])
    monthly_sales_result = await monthly_sales_cursor.to_list(1)
    monthly_sales = monthly_sales_result[0] if monthly_sales_result else {"total": 0, "count": 0}

    total_clients = await db.clients.count_documents({"archived": {"$ne": True}})

    # Category counts
    category_counts = {}
    for cat in PRODUCT_CATEGORIES:
        count = await db.products.count_documents({
            "category": cat["id"],
            "archived": {"$ne": True}
        })
        category_counts[cat["id"]] = count

    return {
        "total_products": total_products,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "monthly_sales_amount": monthly_sales.get("total", 0),
        "monthly_sales_count": monthly_sales.get("count", 0),
        "total_clients": total_clients,
        "categories": PRODUCT_CATEGORIES,
        "category_counts": category_counts
    }

# ============ ACTIVITY LOG ============

async def log_activity(user_id: str, action: str, details: str):
    await db.activity_logs.insert_one({
        "user_id": user_id,
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

# ============ STARTUP ============

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("reference", unique=True)
    await db.products.create_index("category")
    await db.products.create_index([("name", 1), ("reference", 1), ("brand", 1)])
    await db.clients.create_index("phone")
    await db.login_attempts.create_index("identifier")
    await db.activity_logs.create_index("timestamp")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@r2a-industrie.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Administrateur",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin créé: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin mot de passe mis à jour: {admin_email}")

    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write(f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n")
        f.write("## Auth Endpoints\n- POST /api/auth/login\n- POST /api/auth/register\n- GET /api/auth/me\n- POST /api/auth/logout\n- POST /api/auth/refresh\n\n")
        f.write("## Dashboard Endpoints\n- GET /api/dashboard/stats\n")

    logger.info("Application R2A Industrie démarrée")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include router
app.include_router(api_router)

# CORS - must allow the frontend origin for cookies
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [frontend_url]
# Also allow CORS_ORIGINS if set
cors_origins = os.environ.get("CORS_ORIGINS", "")
if cors_origins and cors_origins != "*":
    allowed_origins.extend([o.strip() for o in cors_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
