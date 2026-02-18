# 🐱✨ NyanLook Frontend

**NyanLook Frontend** is a web dashboard built with **Next.js** to visualize GPS data and device details collected by the NyanTrack mobile app and served by the NyanLook API.

It provides:

* 🔐 Authentication (login page)
* 🗺️ Interactive map with live device positions
* 📱 Device system details
* 📊 Simple dashboard to explore tracked devices
* ⚡ Fast, modern React UI

---

## 🚀 Getting Started

### 1️⃣ Install Dependencies

```bash
pnpm install
```

---

### 2️⃣ Run the Dev Server

```bash
pnpm dev
```

Open:

```
http://localhost:3000
```

---

## 🔌 API Integration

The frontend connects to **NyanLook API** to:

* Authenticate users
* Fetch devices list
* Retrieve latest device locations
* Display device details & history

Make sure the backend is running:

```
http://localhost:8000
```

And CORS allows:

```
http://localhost:3000
```

---

## 🗺️ Pages

### 🔐 Login

* Authenticates against `/auth/token`
* Stores JWT for API calls

### 📊 Dashboard

* Interactive map view of devices
* Device list panel
* Click a device to view:

  * 📍 Latest position
  * 📱 System details
  * 📜 Location history
