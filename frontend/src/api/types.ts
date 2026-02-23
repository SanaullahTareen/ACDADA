// ============================================================
// ACDADA API Types — matches FastAPI backend schemas
// ============================================================

// ─── Enums ───────────────────────────────────────────────────
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type DecisionAction =
    | 'block_and_redirect'
    | 'deploy_deception'
    | 'increase_monitoring'
    | 'observe'
    | 'allow';

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
    critical: 'text-red-500 bg-red-500/20 border-red-500',
    high: 'text-orange-500 bg-orange-500/20 border-orange-500',
    medium: 'text-yellow-500 bg-yellow-500/20 border-yellow-500',
    low: 'text-green-500 bg-green-500/20 border-green-500',
};

export const DECISION_COLORS: Record<DecisionAction, string> = {
    block_and_redirect: 'text-red-400 bg-red-500/20',
    deploy_deception: 'text-purple-400 bg-purple-500/20',
    increase_monitoring: 'text-blue-400 bg-blue-500/20',
    observe: 'text-gray-400 bg-gray-500/20',
    allow: 'text-green-400 bg-green-500/20',
};

export const ATTACK_TYPES = [
    'Benign',
    'DDoS',
    'DoS',
    'BruteForce',
    'Botnet',
    'PortScan',
    'Injection',
    'Other',
] as const;

export type AttackType = (typeof ATTACK_TYPES)[number];

export const DECEPTION_ACTIONS = [
    'observe',
    'activate_hp_0',
    'activate_hp_1',
    'activate_hp_2',
    'activate_hp_3',
    'deactivate_all',
    'redirect_to_hp',
    'increase_monitoring',
    'block_attacker',
] as const;

export type DeceptionActionName = (typeof DECEPTION_ACTIONS)[number];

// ─── Request Types ───────────────────────────────────────────
export interface AnalyzeRequest {
    features: number[];
    label?: number;
    flow_id?: string;
}

export interface ThreatDetectRequest {
    features: number[];
}

export interface AnomalyDetectRequest {
    features: number[];
}

export interface ClassifyRequest {
    features: number[];
}

export interface DeceptionActionRequest {
    observation: number[];
    model_type?: 'ppo' | 'ppo_curriculum' | 'dqn';
}

export interface ThreatIntelRequest {
    description: string;
    k?: number;
    category_filter?: string;
    severity_filter?: string;
}

export interface AttackProfileRequest {
    indicators: string[];
}

// ─── Response Types ──────────────────────────────────────────
export interface HealthResponse {
    status: string;
    models_loaded: Record<string, boolean>;
    device: string;
    uptime_seconds: number;
}

export interface AgentMetrics {
    loaded: boolean;
    healthy: boolean;
    avg_latency_ms: number;
    requests_count: number;
    error_count: number;
}

export interface SystemStatusResponse {
    overall_health: number;
    n_agents: number;
    n_alerts: number;
    agents: Record<string, AgentMetrics>;
    uptime_seconds: number;
    total_events_processed: number;
    recent_events: PipelineEvent[];
    healthy: boolean;
    events_processed: number;
}

export interface ThreatDetectResponse {
    is_threat: boolean;
    confidence: number;
    model_used: string;
    latency_ms: number;
}

export interface AnomalyDetectResponse {
    is_anomaly: boolean;
    anomaly_score: number;
    threshold: number;
    method_scores: {
        ae: number;
        vae: number;
        if: number;
    };
    latency_ms: number;
}

export interface ClassifyResponse {
    attack_type: string;
    attack_type_id: number;
    confidence: number;
    probabilities: Record<string, number>;
    latency_ms: number;
}

export interface ThreatIntelResponse {
    likely_category: string;
    likely_severity: string;
    confidence: number;
    top_tags: string[];
    similar_threats: Array<{
        text: string;
        category: string;
        severity: string;
        similarity: number;
        tags: string[];
    }>;
    recommendations: string[];
}

export interface DeceptionActionResponse {
    action_id: number;
    action_name: string;
    model_type: string;
    latency_ms: number;
}

export interface AttackProfileResponse {
    n_indicators: number;
    attack_categories: Record<string, number>;
    overall_severity: string;
    recommendations: string[];
}

export interface PipelineResponse {
    flow_id: string;
    timestamp: string;
    is_threat: boolean;
    threat_confidence: number;
    is_anomaly: boolean;
    anomaly_score: number;
    attack_type?: string;
    attack_confidence?: number;
    severity: SeverityLevel;
    decision: DecisionAction;
    deception_action?: string;
    recommendations: string[];
    consensus_score: number;
    processing_time_ms: number;
    agent_outputs: {
        threat_detection?: ThreatDetectResponse;
        anomaly_detection?: AnomalyDetectResponse;
        classification?: ClassifyResponse;
        threat_intel?: ThreatIntelResponse;
        deception?: DeceptionActionResponse;
    };
}

// ─── WebSocket Event (flattened PipelineResponse) ────────────
export interface PipelineEvent {
    flow_id: string;
    timestamp: string;
    is_threat: boolean;
    threat_confidence: number;
    is_anomaly: boolean;
    anomaly_score: number;
    attack_type?: string;
    attack_confidence?: number;
    severity: SeverityLevel;
    decision: DecisionAction;
    deception_action?: string;
    recommendations: string[];
    consensus_score: number;
    processing_time_ms: number;
}

// ─── Stored Event (for events list) ──────────────────────────
export interface StoredEvent {
    event_id: string;
    timestamp: string;
    is_threat: boolean;
    severity: SeverityLevel;
    attack_type?: string;
    confidence: number;
    decision: DecisionAction;
}

export interface EventsResponse {
    events: StoredEvent[];
    total: number;
    skip: number;
    limit: number;
}

// ─── Utility Types ───────────────────────────────────────────
export interface AgentStatus {
    name: string;
    loaded: boolean;
    health?: number;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    fill?: string;
}
