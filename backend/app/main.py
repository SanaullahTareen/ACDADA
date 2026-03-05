"""
ACDADA — Autonomous Cyber Deception & Adaptive Defense Agent
FastAPI backend entry-point.

Run:
    cd backend
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
import time, uuid, json, numpy as np, torch, torch.nn as nn
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from enum import Enum
from collections import deque, Counter

from fastapi import (
    FastAPI, HTTPException, WebSocket, WebSocketDisconnect,
    BackgroundTasks, Query,
)
from fastapi.middleware.cors import CORSMiddleware
import joblib
import uvicorn

from app.core.config import MODELS_DIR, DEVICE, CORS_ORIGINS
from app.schemas.requests import (
    AnalyzeRequest, ThreatDetectRequest, AnomalyDetectRequest,
    ClassifyRequest, ThreatIntelRequest, AttackProfileRequest,
    DeceptionActionRequest,
)
from app.schemas.responses import (
    PipelineResponse, ThreatDetectResponse, AnomalyDetectResponse,
    ClassifyResponse, DeceptionActionResponse, ThreatIntelResponse,
    HealthResponse, SystemStatusResponse, SeverityLevel, DecisionAction,
)
from app.models.model_loader import (
    ThreatDetector, load_threat_models,
    AnomalyDetector, load_anomaly_models,
    AttackClassifier, load_classifier_models,
    DeceptionAgent, load_deception_model,
    ThreatIntelEngine, load_threat_intel,
)

# ─────────────────────────────────────────────────────────────────────────────
# APP INIT
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ACDADA API",
    description="Autonomous Cyber Deception & Adaptive Defense Agent",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL STATE
# ─────────────────────────────────────────────────────────────────────────────
START_TIME = time.time()
EVENT_LOG: deque = deque(maxlen=1000)
TOTAL_EVENTS = 0

# Model loaders (lazy)
threat_detector: Optional[ThreatDetector] = None
anomaly_detector: Optional[AnomalyDetector] = None
attack_classifier: Optional[AttackClassifier] = None
deception_agent: Optional[DeceptionAgent] = None
threat_intel_engine: Optional[ThreatIntelEngine] = None

# ─────────────────────────────────────────────────────────────────────────────
# STARTUP / SHUTDOWN
# ─────────────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    global threat_detector, anomaly_detector, attack_classifier
    global deception_agent, threat_intel_engine

    print("[ACDADA] Loading models...")
    threat_detector = load_threat_models()
    anomaly_detector = load_anomaly_models()
    attack_classifier = load_classifier_models()
    deception_agent = load_deception_model()
    threat_intel_engine = load_threat_intel()
    print("[ACDADA] Models loaded. API ready.")

@app.on_event("shutdown")
async def shutdown():
    print("[ACDADA] Shutting down.")

# ─────────────────────────────────────────────────────────────────────────────
# HELPER: LOG
# ─────────────────────────────────────────────────────────────────────────────
def _log_event(event: dict):
    global TOTAL_EVENTS
    event["timestamp"] = datetime.now(timezone.utc).isoformat()
    EVENT_LOG.append(event)
    TOTAL_EVENTS += 1

# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health_check():
    return HealthResponse(
        status="ok",
        models_loaded={
            "threat_detector": threat_detector is not None,
            "anomaly_detector": anomaly_detector is not None,
            "attack_classifier": attack_classifier is not None,
            "deception_agent": deception_agent is not None,
            "threat_intel_engine": threat_intel_engine is not None,
        },
        device=str(DEVICE),
        uptime_seconds=time.time() - START_TIME,
    )

@app.get("/status", response_model=SystemStatusResponse, tags=["system"])
async def system_status():
    return SystemStatusResponse(
        overall_health=1.0 if threat_detector else 0.0,
        n_agents=5,
        n_alerts=sum(1 for e in EVENT_LOG if e.get("is_threat")),
        agents={
            "threat_detector": {"loaded": threat_detector is not None},
            "anomaly_detector": {"loaded": anomaly_detector is not None},
            "attack_classifier": {"loaded": attack_classifier is not None},
            "deception_agent": {"loaded": deception_agent is not None},
            "threat_intel": {"loaded": threat_intel_engine is not None},
        },
        uptime_seconds=time.time() - START_TIME,
        total_events_processed=TOTAL_EVENTS,
        recent_events=list(EVENT_LOG)[-20:],
    )

# ─── THREAT DETECTION ────────────────────────────────────────────────────────
@app.post("/detect/threat", response_model=ThreatDetectResponse, tags=["detection"])
async def detect_threat(req: ThreatDetectRequest):
    if threat_detector is None:
        raise HTTPException(503, "Threat detector not loaded")
    t0 = time.time()
    result = threat_detector.predict(req.features, model=req.model)
    latency = (time.time() - t0) * 1000
    _log_event({"endpoint": "detect_threat", "is_threat": result["is_threat"]})
    return ThreatDetectResponse(**result, latency_ms=latency)

# ─── ANOMALY DETECTION ───────────────────────────────────────────────────────
@app.post("/detect/anomaly", response_model=AnomalyDetectResponse, tags=["detection"])
async def detect_anomaly(req: AnomalyDetectRequest):
    if anomaly_detector is None:
        raise HTTPException(503, "Anomaly detector not loaded")
    t0 = time.time()
    result = anomaly_detector.predict(req.features, threshold=req.threshold)
    latency = (time.time() - t0) * 1000
    _log_event({"endpoint": "detect_anomaly", "is_anomaly": result["is_anomaly"]})
    return AnomalyDetectResponse(**result, latency_ms=latency)

# ─── ATTACK CLASSIFICATION ───────────────────────────────────────────────────
@app.post("/classify", response_model=ClassifyResponse, tags=["classification"])
async def classify_attack(req: ClassifyRequest):
    if attack_classifier is None:
        raise HTTPException(503, "Classifier not loaded")
    t0 = time.time()
    result = attack_classifier.predict(req.features, model=req.model)
    latency = (time.time() - t0) * 1000
    _log_event({"endpoint": "classify", "attack_type": result["attack_type"]})
    return ClassifyResponse(**result, latency_ms=latency)

# ─── DECEPTION ACTION ────────────────────────────────────────────────────────
@app.post("/deception/action", response_model=DeceptionActionResponse, tags=["deception"])
async def get_deception_action(req: DeceptionActionRequest):
    if deception_agent is None:
        raise HTTPException(503, "Deception agent not loaded")
    t0 = time.time()
    result = deception_agent.get_action(
        threat_level=req.threat_level,
        attack_type=req.attack_type,
        is_detected=req.is_detected,
    )
    latency = (time.time() - t0) * 1000
    _log_event({"endpoint": "deception_action", "action": result["action_name"]})
    return DeceptionActionResponse(**result, latency_ms=latency)

# ─── THREAT INTELLIGENCE ─────────────────────────────────────────────────────
@app.post("/intel/query", response_model=ThreatIntelResponse, tags=["intelligence"])
async def query_threat_intel(req: ThreatIntelRequest):
    if threat_intel_engine is None:
        raise HTTPException(503, "Threat intel engine not loaded")
    result = threat_intel_engine.query(req.description, k=req.top_k)
    _log_event({"endpoint": "intel_query", "category": result.get("likely_category")})
    return ThreatIntelResponse(**result)

# ─── FULL PIPELINE ───────────────────────────────────────────────────────────
@app.post("/analyze", response_model=PipelineResponse, tags=["pipeline"])
async def analyze_full_pipeline(req: AnalyzeRequest):
    """
    Full ACDADA pipeline:
    1. Threat detection
    2. Anomaly detection
    3. Attack classification (if threat)
    4. Threat intel enrichment
    5. Consensus decision
    6. Deception action
    """
    t0 = time.time()
    flow_id = str(uuid.uuid4())[:12]
    agent_outputs = {}

    # 1. Threat detection
    if threat_detector:
        threat_res = threat_detector.predict(req.features, model=req.threat_model)
    else:
        threat_res = {"is_threat": False, "confidence": 0.0, "model_used": "none"}
    agent_outputs["threat_detector"] = threat_res

    # 2. Anomaly detection
    if anomaly_detector:
        anomaly_res = anomaly_detector.predict(req.features, threshold=req.anomaly_threshold)
    else:
        anomaly_res = {"is_anomaly": False, "anomaly_score": 0.0, "threshold": 0.5, "method_scores": {}}
    agent_outputs["anomaly_detector"] = anomaly_res

    is_threat = threat_res.get("is_threat", False)
    is_anomaly = anomaly_res.get("is_anomaly", False)

    # 3. Classify (if threat or anomaly)
    attack_type = None
    attack_confidence = None
    if (is_threat or is_anomaly) and attack_classifier:
        class_res = attack_classifier.predict(req.features)
        attack_type = class_res.get("attack_type")
        attack_confidence = class_res.get("confidence")
        agent_outputs["attack_classifier"] = class_res
    else:
        agent_outputs["attack_classifier"] = {"attack_type": "Benign", "confidence": 1.0}

    # 4. Threat intel
    recommendations = []
    if threat_intel_engine and (is_threat or is_anomaly):
        desc = f"{attack_type or 'Unknown'} attack with conf={threat_res.get('confidence', 0):.2f}"
        intel_res = threat_intel_engine.query(desc, k=3)
        recommendations = intel_res.get("recommendations", [])
        agent_outputs["threat_intel"] = intel_res

    # 5. Consensus decision
    threat_conf = threat_res.get("confidence", 0) if is_threat else 0
    anomaly_score = anomaly_res.get("anomaly_score", 0) if is_anomaly else 0
    class_conf = attack_confidence if attack_confidence and attack_type != "Benign" else 0
    weights = [0.4, 0.3, 0.3]
    threat_level = threat_conf * weights[0] + anomaly_score * weights[1] + class_conf * weights[2]
    n_agree = sum([1 if is_threat else 0, 1 if is_anomaly else 0, 1 if attack_type and attack_type != "Benign" else 0])
    consensus = n_agree / 3.0

    if threat_level > 0.8 or (n_agree == 3 and threat_level > 0.5):
        severity = SeverityLevel.critical
        decision = DecisionAction.block_and_redirect
    elif threat_level > 0.6 or n_agree >= 2:
        severity = SeverityLevel.high
        decision = DecisionAction.deploy_deception
    elif threat_level > 0.3:
        severity = SeverityLevel.medium
        decision = DecisionAction.increase_monitoring
    else:
        severity = SeverityLevel.low
        decision = DecisionAction.allow

    # 6. Deception action
    deception_action = None
    if deception_agent and (is_threat or is_anomaly):
        dec_res = deception_agent.get_action(
            threat_level=threat_level,
            attack_type=attack_type,
            is_detected=is_threat,
        )
        deception_action = dec_res.get("action_name")
        agent_outputs["deception_agent"] = dec_res

    processing_time = (time.time() - t0) * 1000

    event = {
        "flow_id": flow_id,
        "is_threat": is_threat,
        "is_anomaly": is_anomaly,
        "attack_type": attack_type,
        "severity": severity.value,
        "decision": decision.value,
    }
    _log_event(event)

    return PipelineResponse(
        flow_id=flow_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        is_threat=is_threat,
        threat_confidence=threat_res.get("confidence", 0),
        is_anomaly=is_anomaly,
        anomaly_score=anomaly_res.get("anomaly_score", 0),
        attack_type=attack_type,
        attack_confidence=attack_confidence,
        severity=severity,
        decision=decision,
        deception_action=deception_action,
        recommendations=recommendations,
        consensus_score=consensus,
        processing_time_ms=processing_time,
        agent_outputs=agent_outputs,
    )

# ─── WEBSOCKET FOR STREAMING ─────────────────────────────────────────────────
@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            features = data.get("features", [0.0] * 50)
            # Quick pipeline
            resp = {}
            if threat_detector:
                td = threat_detector.predict(features)
                resp["is_threat"] = td.get("is_threat")
                resp["threat_confidence"] = td.get("confidence")
            if anomaly_detector:
                ad = anomaly_detector.predict(features)
                resp["is_anomaly"] = ad.get("is_anomaly")
                resp["anomaly_score"] = ad.get("anomaly_score")
            resp["timestamp"] = datetime.now(timezone.utc).isoformat()
            await websocket.send_json(resp)
    except WebSocketDisconnect:
        pass

# ─── EVENT LOG ENDPOINT ──────────────────────────────────────────────────────
@app.get("/events", tags=["system"])
async def get_events(
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
):
    all_events = list(EVENT_LOG)
    total = len(all_events)
    # Convert to proper format for frontend
    events = []
    for e in all_events[skip:skip + limit]:
        events.append({
            "event_id": e.get("flow_id", str(uuid.uuid4())[:12]),
            "timestamp": e.get("timestamp", datetime.now(timezone.utc).isoformat()),
            "is_threat": e.get("is_threat", False),
            "severity": e.get("severity", "low"),
            "attack_type": e.get("attack_type"),
            "confidence": e.get("threat_confidence", 0.0) if e.get("is_threat") else 0.0,
            "decision": e.get("decision", "allow"),
        })
    return {
        "events": events,
        "total": total,
        "skip": skip,
        "limit": limit,
    }

# ─── METRICS ─────────────────────────────────────────────────────────────────
@app.get("/metrics", tags=["system"])
async def get_metrics():
    events = list(EVENT_LOG)
    attack_types = Counter(e.get("attack_type") for e in events if e.get("attack_type"))
    return {
        "total_events": TOTAL_EVENTS,
        "threat_rate": sum(1 for e in events if e.get("is_threat")) / max(len(events), 1),
        "anomaly_rate": sum(1 for e in events if e.get("is_anomaly")) / max(len(events), 1),
        "attack_type_distribution": dict(attack_types),
        "uptime_seconds": time.time() - START_TIME,
    }

# ─── Run directly ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
