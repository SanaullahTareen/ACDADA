"""
ACDADA Model Loader — Unified loader for all ML models.
Architectures match actual saved checkpoint structures.
"""
import json
import torch
import torch.nn as nn
import numpy as np
import joblib
from pathlib import Path
from typing import Dict, List, Optional, Any, Union

from app.core.config import MODELS_DIR, DEVICE


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL ARCHITECTURES (matching saved checkpoints)
# ═══════════════════════════════════════════════════════════════════════════════

# ─── THREAT DETECTION ──────────────────────────────────────────────────────────

class MLPThreatDetector(nn.Module):
    """Simple MLP for threat detection."""
    def __init__(self, n_features: int, dropout: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_features, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout * 0.5),
            nn.Linear(64, 2),
        )

    def forward(self, x):
        return self.net(x)


class EnhancedMLPDetector(nn.Module):
    """Enhanced MLP with wider layers for threat detection."""
    def __init__(self, n_features: int, dropout: float = 0.2):
        super().__init__()
        self.input_layer = nn.Sequential(
            nn.Linear(n_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
        )
        self.hidden1 = nn.Sequential(
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
        )
        self.hidden2 = nn.Sequential(
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout * 0.5),
        )
        self.hidden3 = nn.Sequential(
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout * 0.5),
        )
        self.output = nn.Linear(64, 2)

    def forward(self, x):
        x = self.input_layer(x)
        x = self.hidden1(x)
        x = self.hidden2(x)
        x = self.hidden3(x)
        return self.output(x)


# ─── ANOMALY DETECTION ─────────────────────────────────────────────────────────

class DeepAutoencoder(nn.Module):
    """Deep autoencoder matching saved checkpoint: input->128->64->32->latent"""
    def __init__(self, input_dim: int, latent_dim: int = 16):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 128),    # 0
            nn.BatchNorm1d(128),          # 1
            nn.ReLU(inplace=True),        # 2
            nn.Dropout(0.2),              # 3
            nn.Linear(128, 64),           # 4
            nn.BatchNorm1d(64),           # 5
            nn.ReLU(inplace=True),        # 6
            nn.Dropout(0.2),              # 7
            nn.Linear(64, 32),            # 8
            nn.BatchNorm1d(32),           # 9
            nn.ReLU(inplace=True),        # 10
            nn.Linear(32, latent_dim),    # 11
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 32),    # 0
            nn.BatchNorm1d(32),           # 1
            nn.ReLU(inplace=True),        # 2
            nn.Dropout(0.2),              # 3
            nn.Linear(32, 64),            # 4
            nn.BatchNorm1d(64),           # 5
            nn.ReLU(inplace=True),        # 6
            nn.Dropout(0.2),              # 7
            nn.Linear(64, 128),           # 8
            nn.BatchNorm1d(128),          # 9
            nn.ReLU(inplace=True),        # 10
            nn.Linear(128, input_dim),    # 11
        )

    def encode(self, x):
        return self.encoder(x)

    def decode(self, z):
        return self.decoder(z)

    def forward(self, x):
        return self.decode(self.encode(x))


class VAEAnomalyDetector(nn.Module):
    """VAE matching saved checkpoint: encoder_shared->fc_mu/fc_logvar->decoder"""
    def __init__(self, input_dim: int, latent_dim: int = 16):
        super().__init__()
        # Encoder shared layers: input -> 128 -> 64
        self.encoder_shared = nn.Sequential(
            nn.Linear(input_dim, 128),    # 0
            nn.BatchNorm1d(128),          # 1
            nn.ReLU(inplace=True),        # 2
            nn.Dropout(0.2),              # 3
            nn.Linear(128, 64),           # 4
            nn.BatchNorm1d(64),           # 5
            nn.ReLU(inplace=True),        # 6
        )
        self.fc_mu = nn.Linear(64, latent_dim)
        self.fc_logvar = nn.Linear(64, latent_dim)

        # Decoder: latent -> 64 -> 128 -> input
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 64),    # 0
            nn.BatchNorm1d(64),           # 1
            nn.ReLU(inplace=True),        # 2
            nn.Dropout(0.2),              # 3
            nn.Linear(64, 128),           # 4
            nn.BatchNorm1d(128),          # 5
            nn.ReLU(inplace=True),        # 6
            nn.Linear(128, input_dim),    # 7
        )

    def encode(self, x):
        h = self.encoder_shared(x)
        return self.fc_mu(h), self.fc_logvar(h)

    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z):
        return self.decoder(z)

    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        return self.decode(z), mu, logvar


# ─── ATTACK CLASSIFICATION ─────────────────────────────────────────────────────

class ImprovedDNNClassifier(nn.Module):
    """DNN for multi-class attack classification with residual blocks."""
    def __init__(self, input_dim: int, num_classes: int, hidden_dims: List[int] = None):
        super().__init__()
        hidden_dims = hidden_dims or [512, 256, 128, 64]

        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, hidden_dims[0]),  # 0
            nn.LayerNorm(hidden_dims[0]),          # 1
            nn.GELU(),                             # 2
            nn.Dropout(0.3)                        # 3
        )

        self.block1 = self._make_block(hidden_dims[0], hidden_dims[1])
        self.skip1 = nn.Linear(hidden_dims[0], hidden_dims[1])

        self.block2 = self._make_block(hidden_dims[1], hidden_dims[2])
        self.skip2 = nn.Linear(hidden_dims[1], hidden_dims[2])

        self.block3 = self._make_block(hidden_dims[2], hidden_dims[3])
        self.skip3 = nn.Linear(hidden_dims[2], hidden_dims[3])

        self.classifier = nn.Sequential(
            nn.Linear(hidden_dims[3], 32),  # 0
            nn.LayerNorm(32),               # 1
            nn.GELU(),                      # 2
            nn.Dropout(0.2),                # 3
            nn.Linear(32, num_classes)      # 4
        )

    def _make_block(self, in_dim, out_dim):
        return nn.Sequential(
            nn.Linear(in_dim, out_dim),   # 0
            nn.LayerNorm(out_dim),        # 1
            nn.GELU(),                    # 2
            nn.Dropout(0.2),              # 3
            nn.Linear(out_dim, out_dim),  # 4
            nn.LayerNorm(out_dim),        # 5
            nn.GELU(),                    # 6
        )

    def forward(self, x):
        x = self.input_proj(x)
        x = self.block1(x) + self.skip1(x)
        x = self.block2(x) + self.skip2(x)
        x = self.block3(x) + self.skip3(x)
        return self.classifier(x)


# ─── DECEPTION AGENT ───────────────────────────────────────────────────────────

class DuelingDQN(nn.Module):
    """Dueling DQN matching saved checkpoint structure."""
    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 256):
        super().__init__()
        # Features network: Linear -> LayerNorm -> Linear -> LayerNorm
        self.features = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),     # 0
            nn.ReLU(),                            # 1
            nn.LayerNorm(hidden_dim),             # 2 (LayerNorm uses weight/bias without running stats)
            nn.Linear(hidden_dim, hidden_dim),    # 3
            nn.ReLU(),                            # 4
            nn.LayerNorm(hidden_dim),             # 5
        )
        # Value stream: 256 -> 128 -> 1
        self.value_stream = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),  # 0
            nn.ReLU(),                                # 1
            nn.Linear(hidden_dim // 2, 1),           # 2
        )
        # Advantage stream: 256 -> 128 -> action_dim
        self.advantage_stream = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),  # 0
            nn.ReLU(),                                # 1
            nn.Linear(hidden_dim // 2, action_dim),  # 2
        )

    def forward(self, x):
        features = self.features(x)
        value = self.value_stream(features)
        advantage = self.advantage_stream(features)
        return value + advantage - advantage.mean(dim=-1, keepdim=True)


# ═══════════════════════════════════════════════════════════════════════════════
# INFERENCE WRAPPER CLASSES
# ═══════════════════════════════════════════════════════════════════════════════

class ThreatDetector:
    """Threat detection inference wrapper."""
    def __init__(self, models: Dict[str, nn.Module], device: torch.device):
        self.models = models
        self.device = device
        self.default_model = "best" if "best" in models else list(models.keys())[0]

    @torch.no_grad()
    def predict(self, features: List[float], model: str = None) -> Dict[str, Any]:
        model_name = model or self.default_model
        if model_name not in self.models:
            model_name = list(self.models.keys())[0]

        net = self.models[model_name]
        net.eval()

        x = torch.tensor([features], dtype=torch.float32).to(self.device)
        logits = net(x)
        probs = torch.softmax(logits, dim=1)
        pred = torch.argmax(probs, dim=1).item()
        confidence = probs[0, pred].item()

        return {
            "is_threat": pred == 1,
            "confidence": confidence,
            "model_used": model_name,
            "probabilities": {"benign": probs[0, 0].item(), "threat": probs[0, 1].item()}
        }


class AnomalyDetector:
    """Anomaly detection inference wrapper (autoencoder + IF ensemble)."""
    def __init__(self, autoencoder: nn.Module, vae: nn.Module, iforest, device: torch.device, threshold: float = 0.5):
        self.autoencoder = autoencoder
        self.vae = vae
        self.iforest = iforest
        self.device = device
        self.threshold = threshold

    @torch.no_grad()
    def predict(self, features: List[float], threshold: float = None) -> Dict[str, Any]:
        thresh = threshold or self.threshold
        x = torch.tensor([features], dtype=torch.float32).to(self.device)
        scores = {}

        if self.autoencoder:
            self.autoencoder.eval()
            recon = self.autoencoder(x)
            ae_score = torch.mean((x - recon) ** 2).item()
            scores["autoencoder"] = min(ae_score, 1.0)

        if self.vae:
            self.vae.eval()
            recon, mu, logvar = self.vae(x)
            vae_recon = torch.mean((x - recon) ** 2).item()
            scores["vae"] = min(vae_recon, 1.0)

        if self.iforest:
            if_score = -self.iforest.score_samples(np.array([features]))[0]
            scores["isolation_forest"] = min(max(if_score, 0), 1.0)

        ensemble_score = np.mean(list(scores.values())) if scores else 0.0

        return {
            "is_anomaly": ensemble_score > thresh,
            "anomaly_score": float(ensemble_score),
            "threshold": thresh,
            "method_scores": scores
        }


class AttackClassifier:
    """Attack classification inference wrapper (DNN + XGBoost ensemble)."""
    def __init__(self, dnn: nn.Module, xgb_model, label_encoder, device: torch.device):
        self.dnn = dnn
        self.xgb = xgb_model
        self.label_encoder = label_encoder
        self.device = device
        self.classes = list(label_encoder.classes_) if label_encoder else ["Unknown"]

    @torch.no_grad()
    def predict(self, features: List[float], model: str = "ensemble") -> Dict[str, Any]:
        x_np = np.array([features])
        x_t = torch.tensor(x_np, dtype=torch.float32).to(self.device)
        probs_list = []

        if self.dnn:
            self.dnn.eval()
            logits = self.dnn(x_t)
            dnn_probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
            probs_list.append(dnn_probs)

        if self.xgb:
            xgb_probs = self.xgb.predict_proba(x_np)[0]
            probs_list.append(xgb_probs)

        if probs_list:
            ensemble_probs = np.mean(probs_list, axis=0)
            pred_idx = int(np.argmax(ensemble_probs))
            confidence = float(ensemble_probs[pred_idx])
            attack_type = self.classes[pred_idx] if pred_idx < len(self.classes) else "Unknown"
        else:
            attack_type, confidence, ensemble_probs = "Unknown", 0.0, []

        return {
            "attack_type": attack_type,
            "confidence": confidence,
            "class_probabilities": {c: float(ensemble_probs[i]) for i, c in enumerate(self.classes)} if len(ensemble_probs) else {},
            "model_used": model
        }


class DeceptionAgent:
    """Deception agent inference wrapper."""
    ACTIONS = [
        "do_nothing", "deploy_honeypot", "redirect_traffic", "inject_fake_data",
        "isolate_segment", "activate_decoy", "throttle_connection", "log_and_alert", "block_ip"
    ]

    def __init__(self, dqn: nn.Module, device: torch.device, state_dim: int = 95):
        self.dqn = dqn
        self.device = device
        self.state_dim = state_dim

    def _build_state(self, threat_level: float, attack_type: str, is_detected: bool) -> torch.Tensor:
        attack_map = {"DoS": 0, "DDoS": 1, "Reconnaissance": 2, "Theft": 3, "Exploitation": 4, "Analysis": 5, "Normal": 6}
        attack_idx = attack_map.get(attack_type, 6)
        state = [threat_level, float(is_detected), attack_idx / 6.0]
        # Pad to expected state dimension
        while len(state) < self.state_dim:
            state.append(0.0)
        return torch.tensor([state[:self.state_dim]], dtype=torch.float32).to(self.device)

    @torch.no_grad()
    def get_action(self, threat_level: float, attack_type: str = None, is_detected: bool = False) -> Dict[str, Any]:
        if self.dqn:
            self.dqn.eval()
            state = self._build_state(threat_level, attack_type or "Unknown", is_detected)
            q_values = self.dqn(state)
            action_idx = int(torch.argmax(q_values, dim=1).item())
        else:
            # Heuristic fallback
            if threat_level > 0.8:
                action_idx = 4  # isolate_segment
            elif threat_level > 0.5:
                action_idx = 1  # deploy_honeypot
            elif threat_level > 0.3:
                action_idx = 7  # log_and_alert
            else:
                action_idx = 0  # do_nothing

        action_name = self.ACTIONS[action_idx] if action_idx < len(self.ACTIONS) else "do_nothing"
        return {"action_id": action_idx, "action_name": action_name, "threat_level": threat_level}


class ThreatIntelEngine:
    """Threat intelligence query engine using FAISS + TF-IDF."""
    def __init__(self, faiss_index, tfidf_vectorizer, svd_model, metadata: List[Dict] = None):
        self.index = faiss_index
        self.vectorizer = tfidf_vectorizer
        self.svd = svd_model
        self.metadata = metadata or []

    def query(self, description: str, k: int = 5) -> Dict[str, Any]:
        if not self.vectorizer or not self.index:
            return {"similar_threats": [], "recommendations": [], "likely_category": "Unknown"}

        tfidf_vec = self.vectorizer.transform([description])
        if self.svd:
            query_vec = self.svd.transform(tfidf_vec).astype(np.float32)
        else:
            query_vec = tfidf_vec.toarray().astype(np.float32)

        distances, indices = self.index.search(query_vec, k)

        results = []
        for i, idx in enumerate(indices[0]):
            if 0 <= idx < len(self.metadata):
                results.append({"id": int(idx), "distance": float(distances[0][i]), **self.metadata[idx]})

        recommendations = []
        if results:
            cat = results[0].get("category", "Unknown")
            recommendations = [f"Monitor for {cat} attack patterns", "Update IDS signatures", "Review access logs"]

        return {
            "similar_threats": results,
            "recommendations": recommendations,
            "likely_category": results[0].get("category", "Unknown") if results else "Unknown"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# LOADER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def load_threat_models() -> Optional[ThreatDetector]:
    """Load threat detection models."""
    threat_dir = MODELS_DIR / "threat_detection"
    models = {}

    best_path = threat_dir / "best_threat_detector.pth"
    if best_path.exists():
        try:
            checkpoint = torch.load(best_path, map_location=DEVICE, weights_only=False)
            n_features = checkpoint.get("n_features", 77)
            model_class = checkpoint.get("model_class", "EnhancedMLPDetector")

            if model_class == "MLPThreatDetector":
                model = MLPThreatDetector(n_features)
            else:
                model = EnhancedMLPDetector(n_features)

            model.load_state_dict(checkpoint["model_state_dict"])
            model.to(DEVICE)
            models["best"] = model
            print(f"  [ThreatDetector] Loaded {model_class} ({n_features} features)")
        except Exception as e:
            print(f"  [ThreatDetector] Failed to load best: {e}")

    if not models:
        print("  [ThreatDetector] No models found")
        return None

    return ThreatDetector(models, DEVICE)


def load_anomaly_models() -> Optional[AnomalyDetector]:
    """Load anomaly detection models."""
    anomaly_dir = MODELS_DIR / "anomaly_detection"
    autoencoder = None
    vae = None
    iforest = None

    # Load autoencoder
    ae_path = anomaly_dir / "autoencoder.pth"
    if ae_path.exists():
        try:
            checkpoint = torch.load(ae_path, map_location=DEVICE, weights_only=False)
            input_dim = checkpoint.get("n_features", 110)
            latent_dim = checkpoint.get("latent_dim", 16)
            autoencoder = DeepAutoencoder(input_dim, latent_dim)
            autoencoder.load_state_dict(checkpoint["model_state_dict"])
            autoencoder.to(DEVICE)
            print(f"  [AnomalyDetector] Loaded DeepAutoencoder ({input_dim}->{latent_dim})")
        except Exception as e:
            print(f"  [AnomalyDetector] Failed to load autoencoder: {e}")

    # Load VAE
    vae_path = anomaly_dir / "vae.pth"
    if vae_path.exists():
        try:
            checkpoint = torch.load(vae_path, map_location=DEVICE, weights_only=False)
            input_dim = checkpoint.get("n_features", 110)
            latent_dim = checkpoint.get("latent_dim", 16)
            vae = VAEAnomalyDetector(input_dim, latent_dim)
            vae.load_state_dict(checkpoint["model_state_dict"])
            vae.to(DEVICE)
            print(f"  [AnomalyDetector] Loaded VAE ({input_dim}->{latent_dim})")
        except Exception as e:
            print(f"  [AnomalyDetector] Failed to load VAE: {e}")

    # Load Isolation Forest
    if_path = anomaly_dir / "isolation_forest.joblib"
    if if_path.exists():
        try:
            iforest = joblib.load(if_path)
            print(f"  [AnomalyDetector] Loaded Isolation Forest")
        except Exception as e:
            print(f"  [AnomalyDetector] Failed to load IF: {e}")

    threshold = 0.5
    config_path = anomaly_dir / "ensemble_config.joblib"
    if config_path.exists():
        try:
            config = joblib.load(config_path)
            threshold = config.get("threshold", 0.5)
        except:
            pass

    if not autoencoder and not vae and not iforest:
        print("  [AnomalyDetector] No models found")
        return None

    return AnomalyDetector(autoencoder, vae, iforest, DEVICE, threshold)


def load_classifier_models() -> Optional[AttackClassifier]:
    """Load attack classification models."""
    class_dir = MODELS_DIR / "attack_classification"
    dnn = None
    xgb_model = None
    label_encoder = None

    # Load label encoder
    le_path = class_dir / "label_encoder.joblib"
    if le_path.exists():
        try:
            label_encoder = joblib.load(le_path)
            print(f"  [AttackClassifier] Loaded label encoder: {len(label_encoder.classes_)} classes")
        except Exception as e:
            print(f"  [AttackClassifier] Failed to load label encoder: {e}")

    num_classes = len(label_encoder.classes_) if label_encoder else 7

    # Load DNN - checkpoint is raw state_dict
    dnn_path = class_dir / "improved_dnn.pth"
    if dnn_path.exists():
        try:
            state_dict = torch.load(dnn_path, map_location=DEVICE, weights_only=False)
            # Infer dimensions from state dict
            input_dim = state_dict["input_proj.0.weight"].shape[1]
            num_classes = state_dict["classifier.4.weight"].shape[0]
            dnn = ImprovedDNNClassifier(input_dim, num_classes)
            dnn.load_state_dict(state_dict)
            dnn.to(DEVICE)
            print(f"  [AttackClassifier] Loaded DNN ({input_dim} -> {num_classes} classes)")
        except Exception as e:
            print(f"  [AttackClassifier] Failed to load DNN: {e}")

    # Load XGBoost
    xgb_path = class_dir / "xgboost_classifier.joblib"
    if xgb_path.exists():
        try:
            xgb_model = joblib.load(xgb_path)
            print(f"  [AttackClassifier] Loaded XGBoost")
        except Exception as e:
            print(f"  [AttackClassifier] Failed to load XGBoost: {e}")

    if not dnn and not xgb_model:
        print("  [AttackClassifier] No models found")
        return None

    return AttackClassifier(dnn, xgb_model, label_encoder, DEVICE)


def load_deception_model() -> Optional[DeceptionAgent]:
    """Load deception RL agent."""
    deception_dir = MODELS_DIR / "deception_agent"
    dqn = None
    state_dim = 95

    dqn_path = deception_dir / "dqn_best.pth"
    if not dqn_path.exists():
        dqn_path = deception_dir / "dqn_final.pth"

    if dqn_path.exists():
        try:
            state_dict = torch.load(dqn_path, map_location=DEVICE, weights_only=False)
            # Infer dimensions from state dict
            state_dim = state_dict["features.0.weight"].shape[1]
            action_dim = state_dict["advantage_stream.2.weight"].shape[0]
            hidden_dim = state_dict["features.0.weight"].shape[0]
            dqn = DuelingDQN(state_dim, action_dim, hidden_dim)
            dqn.load_state_dict(state_dict)
            dqn.to(DEVICE)
            print(f"  [DeceptionAgent] Loaded DQN ({state_dim} -> {action_dim} actions)")
        except Exception as e:
            print(f"  [DeceptionAgent] Failed to load DQN: {e}")

    return DeceptionAgent(dqn, DEVICE, state_dim)


def load_threat_intel() -> Optional[ThreatIntelEngine]:
    """Load threat intelligence engine."""
    intel_dir = MODELS_DIR / "threat_intel"

    tfidf = None
    svd = None
    faiss_index = None
    metadata = []

    # Load TF-IDF vectorizer
    tfidf_path = intel_dir / "tfidf_vectorizer.joblib"
    if tfidf_path.exists():
        try:
            tfidf = joblib.load(tfidf_path)
            print(f"  [ThreatIntel] Loaded TF-IDF vectorizer")
        except Exception as e:
            print(f"  [ThreatIntel] Failed to load TF-IDF: {e}")

    # Load SVD
    svd_path = intel_dir / "tfidf_svd.joblib"
    if svd_path.exists():
        try:
            svd = joblib.load(svd_path)
            print(f"  [ThreatIntel] Loaded SVD")
        except Exception as e:
            print(f"  [ThreatIntel] Failed to load SVD: {e}")

    # Load FAISS index - check actual filename
    faiss_dir = intel_dir / "faiss"
    for index_name in ["faiss_index.bin", "index.faiss", "index.bin"]:
        index_path = faiss_dir / index_name
        if index_path.exists():
            try:
                import faiss
                faiss_index = faiss.read_index(str(index_path))
                print(f"  [ThreatIntel] Loaded FAISS index: {faiss_index.ntotal} vectors")
                break
            except Exception as e:
                print(f"  [ThreatIntel] Failed to load FAISS from {index_name}: {e}")

    # Load metadata (try both .json and .joblib)
    for meta_name in ["metadata.json", "metadata.joblib"]:
        meta_path = faiss_dir / meta_name
        if meta_path.exists():
            try:
                if meta_name.endswith(".json"):
                    with open(meta_path, "r", encoding="utf-8") as f:
                        metadata = json.load(f)
                else:
                    metadata = joblib.load(meta_path)
                print(f"  [ThreatIntel] Loaded {len(metadata)} metadata entries")
                break
            except Exception as e:
                print(f"  [ThreatIntel] Failed to load metadata: {e}")

    if not tfidf or not faiss_index:
        print("  [ThreatIntel] Incomplete setup (missing TF-IDF or FAISS)")
        return None

    return ThreatIntelEngine(faiss_index, tfidf, svd, metadata)
