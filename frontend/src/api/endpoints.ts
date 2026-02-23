import apiClient from './client';
import type {
    AnalyzeRequest,
    AnomalyDetectRequest,
    AnomalyDetectResponse,
    AttackProfileRequest,
    AttackProfileResponse,
    ClassifyRequest,
    ClassifyResponse,
    DeceptionActionRequest,
    DeceptionActionResponse,
    EventsResponse,
    HealthResponse,
    PipelineResponse,
    SystemStatusResponse,
    ThreatDetectRequest,
    ThreatDetectResponse,
    ThreatIntelRequest,
    ThreatIntelResponse,
} from './types';

// ─── System ──────────────────────────────────────────────────
export async function getHealth(): Promise<HealthResponse> {
    const { data } = await apiClient.get<HealthResponse>('/health');
    return data;
}

export async function getSystemStatus(): Promise<SystemStatusResponse> {
    const { data } = await apiClient.get<SystemStatusResponse>('/status');
    return data;
}

// ─── Pipeline ────────────────────────────────────────────────
export async function analyzeEvent(req: AnalyzeRequest): Promise<PipelineResponse> {
    const { data } = await apiClient.post<PipelineResponse>('/analyze', req);
    return data;
}

// ─── Individual Agents ───────────────────────────────────────
export async function detectThreat(req: ThreatDetectRequest): Promise<ThreatDetectResponse> {
    const { data } = await apiClient.post<ThreatDetectResponse>('/detect/threat', req);
    return data;
}

export async function detectAnomaly(req: AnomalyDetectRequest): Promise<AnomalyDetectResponse> {
    const { data } = await apiClient.post<AnomalyDetectResponse>('/detect/anomaly', req);
    return data;
}

export async function classifyAttack(req: ClassifyRequest): Promise<ClassifyResponse> {
    const { data } = await apiClient.post<ClassifyResponse>('/classify', req);
    return data;
}

export async function getDeceptionAction(req: DeceptionActionRequest): Promise<DeceptionActionResponse> {
    const { data } = await apiClient.post<DeceptionActionResponse>('/deception/action', req);
    return data;
}

// ─── Threat Intelligence ─────────────────────────────────────
export async function queryThreatIntel(req: ThreatIntelRequest): Promise<ThreatIntelResponse> {
    const { data } = await apiClient.post<ThreatIntelResponse>('/intel/query', req);
    return data;
}

export async function profileAttack(req: AttackProfileRequest): Promise<AttackProfileResponse> {
    const { data } = await apiClient.post<AttackProfileResponse>('/intel/profile', req);
    return data;
}

// ─── Events ──────────────────────────────────────────────────
export async function getEvents(params: Record<string, string | number> = {}): Promise<EventsResponse> {
    const { data } = await apiClient.get<EventsResponse>('/events', { params });
    return data;
}
