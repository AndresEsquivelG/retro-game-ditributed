import os
import random
from datetime import datetime
import traceback

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from sqlalchemy import (
    create_engine, Column, Float, String, DateTime,
    MetaData, Table, Boolean, Integer, select, desc
)
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker

from backend.tasks import process_player_move, generate_food, detect_collision

load_dotenv()
DB_URL  = os.getenv("DATABASE_URL")
raw     = os.getenv("CORS_ORIGINS", "")
ORIGINS = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]

# Connection and table definitions
engine = create_engine(DB_URL)
meta   = MetaData()

# Current metrics table
current_metrics = Table(
    "current_metrics", meta,
    Column("hostname",     String, primary_key=True),
    Column("cpu_percent",  Float,  nullable=False),
    Column("ram_total_mb", Float,  nullable=False),
    Column("ram_used_mb",  Float,  nullable=False),
    Column("ram_percent",  Float,  nullable=False),
    Column("temperature",  Float,  nullable=True),
    Column("timestamp",    DateTime, nullable=False),
)

# Log table for heavy tasks
task_status_log = Table(
    "task_status_log", meta,
    Column("id",         Integer, primary_key=True, autoincrement=True),
    Column("hostname",   String,  nullable=False),
    Column("task_name",  String,  nullable=False),
    Column("delivered",  Boolean, nullable=False),
    Column("created_at", DateTime, nullable=False),
)

# Create tables if they don't exist
#meta.create_all(engine)
Session = sessionmaker(bind=engine)

# FastAPI app and CORS configuration
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for receiving metrics
class MetricsIn(BaseModel):
    hostname:     str
    cpu_percent:  float
    ram_total_mb: float
    ram_used_mb:  float
    ram_percent:  float
    temperature:  float | None
    timestamp:    float
    
class NextMoveIn(BaseModel):
    segments:  list[dict]
    direction: str = Field(..., pattern="^(up|down|left|right)$")

class NextMoveOut(BaseModel):
    segments: list[dict]

class FoodIn(BaseModel):
    segments: list[dict]

class FoodOut(BaseModel):
    x: int
    y: int

class CollideIn(BaseModel):
    segments: list[dict]
    food:     dict

class CollideOut(BaseModel):
    dead: bool
    ate:  bool

in_memory_metrics = {}

@app.post("/metrics")
def receive_metrics(m: MetricsIn):
    in_memory_metrics[m.hostname] = {
        "hostname":     m.hostname,
        "cpu_percent":  m.cpu_percent,
        "ram_total_mb": m.ram_total_mb,
        "ram_used_mb":  m.ram_used_mb,
        "ram_percent":  m.ram_percent,
        "temperature":  m.temperature,
        "timestamp":    datetime.fromtimestamp(m.timestamp).isoformat(),
    }
    return {"status": "ok"}

@app.get("/metrics")
def list_metrics():
    return list(in_memory_metrics.values())

# Endpoint to retrieve heavy tasks logs
@app.get("/logs")
def read_logs(limit: int = 10):
    s = Session()
    try:
        stmt = (
            select(
                task_status_log.c.hostname,
                task_status_log.c.task_name,
                task_status_log.c.delivered,
                task_status_log.c.created_at,
            )
            .order_by(desc(task_status_log.c.created_at))
            .limit(limit)
        )
        rows = s.execute(stmt).all()
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        s.close()

    return [
        {
            "hostname":   h,
            "task_name":  t,
            "delivered":  d,
            "created_at": ct.isoformat(),
        }
        for h, t, d, ct in rows
    ]

# ————— Endpoints Snake distribuido —————

@app.post("/next-move", response_model=NextMoveOut)
def next_move(data: NextMoveIn):
    """
    Nodo 1: procesa movimiento de la serpiente via Celery (Nodo 2).
    """
    try:
        segs = process_player_move.apply_async(
            args=[data.segments, data.direction],
            queue="movement"
        ).get(timeout=1)
        return {"segments": segs}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Error en process_player_move: {e}")


@app.post("/generate-food", response_model=FoodOut)
def new_food(data: FoodIn):
    """
    Nodo 1: genera nueva comida via Celery (Nodo 3).
    """
    try:
        food = generate_food.apply_async(
            args=[data.segments],
            queue="food"
        ).get(timeout=1)
        return food
    except Exception as e:
        raise HTTPException(500, f"Error en generate_food: {e}")

@app.post("/check-collision", response_model=CollideOut)
def check_collision(data: CollideIn):
    """
    Nodo 1: detecta colisiones via Celery (Nodo 4).
    """
    try:
        outcome = detect_collision.apply_async(
            args=[data.segments, data.food],
            queue="collisions"
        ).get(timeout=1)
        return outcome
    except Exception as e:
        raise HTTPException(500, f"Error en detect_collision: {e}")
