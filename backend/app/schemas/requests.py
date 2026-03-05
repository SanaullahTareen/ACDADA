from pydantic import BaseModel, Field
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    features: List[float] = Field(..., description="Numeric feature vector")
    label: int = Field(-1, description="Ground-truth label (-1 = unknown)")
    flow_id: Optional[str] = None
    threat_model: str = Field("mlp", description="Model for threat detection")
    anomaly_threshold: float = Field(0.5, ge=0, le=1)

class ThreatDetectRequest(BaseModel):
    features: List[float]
    model: str = Field("mlp", description="mlp, ensemble, etc.")

class AnomalyDetectRequest(BaseModel):
    features: List[float]
    threshold: float = Field(0.5, ge=0, le=1)

class ClassifyRequest(BaseModel):
    features: List[float]
    model: str = Field("dnn", description="dnn, xgboost, ensemble")

class ThreatIntelRequest(BaseModel):
    description: str = Field(..., min_length=5)
    top_k: int = Field(5, ge=1, le=20)
    category_filter: Optional[str] = None
    severity_filter: Optional[str] = None

class AttackProfileRequest(BaseModel):
    indicators: List[str] = Field(..., min_length=1)

class DeceptionActionRequest(BaseModel):
    threat_level: float = Field(0.5, ge=0, le=1)
    attack_type: Optional[str] = None
    is_detected: bool = False
