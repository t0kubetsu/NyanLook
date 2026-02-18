# 🐱✨ NyanLook API

**NyanLook API** is a FastAPI backend designed to receive telemetry data from [**NyanCat**](https://github.com/t0kubetsu/NyanTrack) (mobile client) and expose secure endpoints to query GPS locations and device details.

It supports:

* 📡 Data ingestion
* 🔐 JWT authentication
* 🧠 KV-based storage via **Kvrocks**
* 🐳 Fully dockerized deployment
* ⚡ High-performance API powered by **FastAPI**

---

## 🚀 Getting Started

### 1️⃣ Requirements

* Docker
* Kvrocks running somewhere (local or remote)

Example (local Kvrocks):

```bash
docker run -d -p 6666:6666 apache/kvrocks
```

---

### 2️⃣ Build & Run

```bash
docker build -t nyanlook-api .
docker run -p 8000:8000 nyanlook-api
```

The API will be available at:

```
http://localhost:8000
```

Swagger UI:

```
http://localhost:8000/docs
```

---

## ⚙️ Configuration (Environment Variables)

NyanLook API uses the following environment variables:

```env
KVROCKS_HOST=kvrocks
KVROCKS_PORT=6666
CORS_ORIGINS=http://localhost:3000
```

* **`KVROCKS_HOST`**: Hostname or IP of your Kvrocks instance
* **`KVROCKS_PORT`**: Kvrocks port
* **`CORS_ORIGINS`**: Allowed CORS origins (comma-separated if multiple)

---

## 🔐 Authentication

NyanLook API uses OAuth2 password flow.

### Get Token

```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=admin&password=admin
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Then use it in headers:

```http
Authorization: Bearer <token>
```

---

## 📡 API Endpoints

### 🔓 Public

| Method | Path           | Description      |
| ------ | -------------- | ---------------- |
| POST   | `/auth/token`  | Get JWT token    |
| POST   | `/{full_path}` | Catch-all ingest |

### 🔐 Protected (JWT Required)

| Method | Path                                   | Description      |
| ------ | -------------------------------------- | ---------------- |
| GET    | `/devices`                             | List all devices |
| GET    | `/device/{device_id}`                  | Device info      |
| GET    | `/device/{device_id}/details`          | Device details   |
| GET    | `/device/{device_id}/location`         | Latest location  |
| GET    | `/device/{device_id}/location/history` | Location history |
| GET    | `/device/{device_id}/location/stats`   | Location stats   |

---

## 📦 Data Storage

All telemetry data is stored in **Kvrocks**, a Redis-compatible key-value store.
This allows:

* ⚡ Fast writes from mobile clients
* 🔄 Easy scaling
* 🧰 Compatibility with Redis tooling

---

## 🧪 Development

Run locally without Docker:

```bash
pip install -r requirements.txt
fastapi dev api/main.py
```
