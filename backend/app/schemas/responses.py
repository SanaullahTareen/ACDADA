from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from enum import Enum

class SeverityLevel(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"

class DecisionAction(str, Enum):
    block_and_redirect  = "block_and_redirect"
    deploy_deception    = "deploy_deception"
    increase_monitoring = "increase_monitoring"
    observe             = "observe"
    allow               = "allow"

class ThreatDetectResponse(BaseModel):
    is_threat: bool
    confidence: float
    model_used: str
    latency_ms: float

class AnomalyDetectResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    threshold: float
    method_scores: Dict[str, float]
    latency_ms: float

class ClassifyResponse(BaseModel):
    attack_type: str
    attack_type_id: int
    confidence: float
    probabilities: Dict[str, float]
    latency_ms: float

class ThreatIntelResponse(BaseModel):
    likely_category: str
    likely_severity: str
    confidence: float
    top_tags: List[str]
    similar_threats: List[Dict[str, Any]]
    recommendations: List[str]

class DeceptionActionResponse(BaseModel):
    action_id: int
    action_name: str
    model_type: str
    latency_ms: float

class PipelineResponse(BaseModel):
    flow_id: str
    timestamp: str
    is_threat: bool
    threat_confidence: float
    is_anomaly: bool
    anomaly_score: float
    attack_type: Optional[str] = None
    attack_confidence: Optional[float] = None
    severity: SeverityLevel
    decision: DecisionAction
    deception_action: Optional[str] = None
    recommendations: List[str] = []
    consensus_score: float = 0.0
    processing_time_ms: float
    agent_outputs: Dict[str, Any] = {}

class SystemStatusResponse(BaseModel):
    overall_health: float
    n_agents: int
    n_alerts: int
    agents: Dict[str, Any]
    uptime_seconds: float
    total_events_processed: int
    recent_events: List[Dict[str, Any]] = []

class HealthResponse(BaseModel):
    status: str
    models_loaded: Dict[str, bool]
    device: str
    uptime_seconds: float
