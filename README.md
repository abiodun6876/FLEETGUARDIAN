# FLEETGUARDIAN // Smart Fleet Safety System

A high-performance fleet safety platform using React PWAs and Supabase.

## 🚀 Quick Start

### 1. Supabase Setup
- Create a new project at [supabase.com](https://supabase.com).
- Run the SQL migration found in `supabase/migrations/20240207_initial_schema.sql`.
- Enable **Realtime** for `locations`, `vehicles`, and `events` tables in the Supabase Dashboard.

### 2. Configure Apps
Create `.env` files in both `device-app/` and `dashboard/` using the `.env.example` templates:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Install & Run
```bash
# In device-app/
npm install
npm run dev

# In dashboard/
npm install
npm run dev
```

## 📱 Device App (PWA)
- Designed to run on an Android phone mounted in the vehicle.
- Provides real-time GPS tracking.
- Interactive HUD for camera and audio preview.
- SOS emergency trigger.

## 🖥 Dashboard
- Mission Control interface for fleet managers.
- Real-time map tracking with Leaflet.
- Emergency notification system.
- Historical route analytics.

## 🛠 Tech Stack
- **Frontend**: React, Vite, Framer Motion, Lucide Icons.
- **Maps**: Leaflet (using CartoDB Dark Matter tiles).
- **Backend**: Supabase (PostgreSQL, Realtime, Auth, Storage).
