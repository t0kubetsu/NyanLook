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
JWT_SECRET_KEY=changeme-use-a-real-secret-in-prod
APP_USERNAME=admin
APP_PASSWORD_HASH=$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
JWT_EXPIRE_MINUTES=1440
```

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `KVROCKS_HOST` | `kvrocks` | Hostname or IP of your Kvrocks instance |
| `KVROCKS_PORT` | `6666` | Kvrocks port |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated if multiple) |
| `JWT_SECRET_KEY` | `changeme-use-a-real-secret-in-prod` | Secret key used to sign JWT tokens — **change this in production** |
| `APP_USERNAME` | `admin` | Login username |
| `APP_PASSWORD_HASH` | *(bcrypt hash of `secret`)* | Bcrypt hash of the login password — see [Generating a Password Hash](#-generating-a-password-hash) |
| `JWT_EXPIRE_MINUTES` | `1440` | Token expiry duration in minutes (default: 24h) |

> ⚠️ **Never use the default `JWT_SECRET_KEY` in production.** Generate a strong random key, e.g.:
> ```bash
> openssl rand -hex 32
> ```

---

## 🔐 Authentication

NyanLook API uses OAuth2 password flow.

### 🔑 Generating a Password Hash

Before deploying, generate a bcrypt hash for your chosen password:
```bash
python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('yourpassword'))"
```

This will output a hash like:
```
$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
```

Then set the following environment variables (e.g. in your `.env` file or `docker-compose.yml`):
```env
APP_USERNAME=admin
APP_PASSWORD_HASH=$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRE_MINUTES=1440
```

> ⚠️ **Docker Compose note:** if you inline the hash directly in `docker-compose.yml` under `environment:`, escape every `$` as `$$` to prevent variable interpolation. Using an `env_file` is recommended instead.

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
