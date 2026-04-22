# ACDADA - Autonomous Cyber Deception & Adaptive Defense Agent

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**An intelligent, multi-agent cybersecurity system combining deep learning threat detection, reinforcement learning-based deception, and RAG-powered threat intelligence.**

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Usage](#usage) • [API](#api-documentation) • [Contributing](#contributing)

</div>

---

## 🎯 Overview

ACDADA is a next-generation autonomous cyber defense platform that leverages multiple AI agents working in concert to detect, analyze, and respond to cyber threats in real-time. The system employs:

- **Deep Learning** for threat detection and attack classification
- **Reinforcement Learning** for adaptive deception strategies
- **RAG (Retrieval-Augmented Generation)** for threat intelligence
- **Multi-Agent Orchestration** for coordinated defense responses

## ✨ Features

### 🛡️ Threat Detection
- **CNN-LSTM Binary Classifier**: Real-time threat detection with 94%+ accuracy
- **Multi-Model Anomaly Detection**: Ensemble of Autoencoder, VAE, and Isolation Forest
- **Zero-Day Detection**: Unsupervised anomaly scoring for unknown threats

### 🎭 Intelligent Deception
- **RL-Based Honeypot Orchestration**: DQN/PPO agents for adaptive deception
- **Dynamic Honeypot Management**: Automatic activation and traffic redirection
- **Curriculum Learning**: Progressive difficulty training for robust policies

### 🔍 Attack Classification
- **XGBoost + DNN Ensemble**: Multi-class classification (8 attack types)
- **Confidence Calibration**: Reliable probability estimates
- **Real-time Processing**: Sub-100ms inference latency

### 🧠 Threat Intelligence Memory
- **Vector Store (ChromaDB/FAISS)**: Semantic search over 10k+ CTI documents
- **RAG Pipeline**: Context-aware threat analysis and recommendations
- **Attack Profiling**: MITRE ATT&CK aligned threat profiles

### 📊 Self-Evaluation & Drift Detection
- **Population Stability Index (PSI)**: Automated drift monitoring
- **Adaptive Thresholds**: Self-tuning detection boundaries
- **Performance Tracking**: Continuous model health assessment

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ACDADA Platform                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Threat    │  │   Anomaly   │  │   Attack    │  │  Deception │ │
│  │  Detection  │  │  Detection  │  │ Classifier  │  │   Agent    │ │
│  │  (CNN-LSTM) │  │ (AE/VAE/IF) │  │(XGBoost+DNN)│  │  (DQN/PPO) │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬─────┘ │
│         │                │                │                │       │
│  ┌──────┴────────────────┴────────────────┴────────────────┴─────┐ │
│  │                    Agent Orchestrator                         │ │
│  │          (Consensus Voting + Weighted Aggregation)            │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                             │                                      │
│  ┌──────────────────────────┴────────────────────────────────────┐ │
│  │                    FastAPI Backend                            │ │
│  │          (REST API + WebSocket Real-time Events)              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                             │                                      │
│  ┌──────────────────────────┴────────────────────────────────────┐ │
│  │                    React Dashboard                            │ │
│  │       (Real-time Monitoring + Interactive Analysis)           │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
ACDADA/
├── backend/                    # FastAPI backend application
│   └── app/
│       ├── api/               # API route handlers
│       ├── core/              # Configuration and utilities
│       ├── models/            # ML model loading and inference
│       └── schemas/           # Pydantic request/response schemas
├── frontend/                   # React TypeScript dashboard
│   └── src/
│       ├── api/               # API client and types
│       ├── components/        # Reusable UI components
│       ├── context/           # React context providers
│       ├── hooks/             # Custom React hooks
│       ├── layouts/           # Page layouts
│       └── pages/             # Application pages
├── notebooks/                  # Jupyter notebooks (development)
│   ├── 01_data_preprocessing.ipynb
│   ├── 02_threat_detection.ipynb
│   ├── 03_anomaly_detection.ipynb
│   ├── 04_attack_classification.ipynb
│   ├── 05_deception_environment.ipynb
│   ├── 06_deception_rl_agent.ipynb
│   ├── 07_threat_intelligence_memory.ipynb
│   ├── 08_self_evaluation_agent.ipynb
│   ├── 09_agent_orchestration.ipynb
│   └── 10_fastapi_backend.ipynb
├── models/                     # Trained model weights
├── data/
│   ├── raw/                   # Raw datasets
│   └── processed/             # Preprocessed data
└── logs/                       # Application logs
```

## 🚀 Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- CUDA 11.8+ (optional, for GPU acceleration)

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 💻 Usage

### Starting the Platform

1. **Start Backend**:
   ```bash
   uvicorn backend.app.main:app --reload
   ```

2. **Start Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

3. Open `http://localhost:5173` in your browser

### Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Real-time KPIs, charts, and agent status overview |
| **Live Simulation** | Generate and analyze security events in real-time |
| **Detection** | Test threat and anomaly detection models |
| **Classification** | Multi-class attack type classification |
| **Deception** | RL agent decision visualization and honeypot status |
| **Intel Memory** | CTI search and attack profiling |
| **System Metrics** | Agent health monitoring and drift detection |
| **Events** | Paginated event history with filters |
| **Settings** | Configuration for thresholds and API endpoints |

## 📡 API Documentation

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | System health check |
| `/status` | GET | Detailed system status |
| `/analyze` | POST | Full pipeline analysis |
| `/detect/threat` | POST | Threat detection only |
| `/detect/anomaly` | POST | Anomaly detection only |
| `/classify` | POST | Attack classification |
| `/deception/action` | POST | Get RL agent decision |
| `/intel/query` | POST | Query threat intelligence |
| `/intel/profile` | POST | Profile attack indicators |
| `/events` | GET | Retrieve stored events |

### WebSocket

Connect to `ws://localhost:8000/ws/events` for real-time event streaming.

### Example Request

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"features": [0.1, 0.2, ..., 0.78], "flow_id": "test-001"}'
```

## 🔬 Model Performance

| Model | Task | Accuracy | F1-Score | Latency |
|-------|------|----------|----------|---------|
| CNN-LSTM | Threat Detection | 94.5% | 0.943 | 12ms |
| AE+VAE+IF | Anomaly Detection | 91.2% | 0.908 | 18ms |
| XGBoost+DNN | Classification | 89.8% | 0.891 | 25ms |
| PPO Agent | Deception | N/A | N/A | 8ms |

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI
- **ML/DL**: PyTorch, scikit-learn, XGBoost
- **RL**: Stable-Baselines3, Gymnasium
- **Vector Store**: ChromaDB, FAISS
- **Embeddings**: Sentence-Transformers

### Frontend
- **Framework**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Abdullah Tareen**
- Email: sanaullahtareen.info@gmail.com
- GitHub: https://github.com/SanaullahTareen/

## 🙏 Acknowledgments

- [CIC-IDS2017/2018 Dataset](https://www.unb.ca/cic/datasets/ids.html) for network traffic data
- [MITRE ATT&CK](https://attack.mitre.org/) for threat intelligence framework
- [Stable-Baselines3](https://stable-baselines3.readthedocs.io/) for RL implementations

---

<div align="center">

**[⬆ Back to Top](#acdada---autonomous-cyber-deception--adaptive-defense-agent)**

Made with ❤️ for cybersecurity research

</div>
