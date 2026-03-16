# QA Developer Interview Test Platform

A full-stack MERN web application where admins can create tests and candidates can take timed assessments.

## Local Development (Docker)

To run the entire stack locally using Docker Compose:

1. Ensure Docker Desktop is running.
2. In the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. Access the frontend at `http://localhost:5173` and the backend at `http://localhost:5000`.

## Manual Setup

### 1. Database
- Create a Cluster on **MongoDB Atlas**.
- Whitelist IP addresses (`0.0.0.0/0` for everywhere).
- Get the Connection URI (`mongodb+srv://...`).

### 2. Backend (Node + Express)
Environment Variables (`backend/.env`):
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

Run commands:
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend (React + Vite)
Environment Variables (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

Run commands:
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Backend (Render or Railway)
1. Push the repository to GitHub.
2. Create a new Web Service on Render / Railway and connect the repo.
3. Set the Root Directory to `backend` (if supported) or use the Dockerfile.
4. Add the Environment Variables (`MONGO_URI`, `JWT_SECRET`).
5. Deploy and copy the provided backend URL.

### Frontend (Vercel or Netlify)
1. Go to Vercel/Netlify and import your GitHub repository.
2. Set the Root Directory to `frontend`.
3. Set Build Command: `npm run build`
4. Set Publish Directory: `dist`
5. Add the Environment Variable `VITE_API_URL` pointing to your deployed backend URL (e.g., `https://my-backend.onrender.com/api`).
6. Deploy.
