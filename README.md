# 🐱✨ NyanLook – Full Stack GPS Tracking Platform

**NyanLook** is a full-stack GPS tracking platform composed of:

* 🧠 **NyanLook API** – a backend built with **FastAPI** to ingest telemetry from the mobile app and expose secure querying endpoints
* 🗺️ **NyanLook Frontend** – a web dashboard built with **Next.js** to visualize device locations and details

It supports:

* 📡 Data ingestion from mobile devices with [NyanTrack](https://github.com/t0kubetsu/NyanTrack) installed and running
* 🔐 JWT authentication
* 🧠 KV-based storage via **Kvrocks**
* 🗺️ Real-time-ish map visualization
* 🐳 Fully dockerized deployment
* ⚡ High-performance backend & modern frontend UI

---

## 🧱 Project Structure

```
.
├── nyanlook_api              # FastAPI backend
├── nyanlook_web              # Next.js frontend
├── docker-compose.yml
└── README.md 
```

---

## 🚀 Quick Start (Full Stack with Docker)

### 1️⃣ Requirements

* Docker
* Docker Compose

### 2️⃣ Setup Environment Files

Before building, copy the example `.env` files and edit them to match your infrastructure:

```bash
cp nyanlook_api/.env.example nyanlook_api/.env
cp nyanlook_web/.env.example nyanlook_web/.env
```

Open the two `.env` files and adjust values such as `NEXT_PUBLIC_API_URL` and any database or secret settings to fit your environment.

### 2️⃣ Build & Run Everything

```bash
docker compose up --build
```

Services:

* NyanLook API → [http://localhost:8000](http://localhost:8000)
* NyanLook Frontend → [http://localhost:3000](http://localhost:3000)
