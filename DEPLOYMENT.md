# KadelLabs L&D Platform - Deployment Guide

This guide covers how to deploy the KadelLabs L&D MERN Stack application to the public internet so candidates can take tests from anywhere. We will use three separate free/low-cost services:

1. **MongoDB Atlas** for the Database
2. **Render** for the Node.js Backend API
3. **Vercel** for the React Frontend

---

## Step 1: Deploy MongoDB Data to MongoDB Atlas

Your local data is currently trapped inside Docker. To store it on the internet, you need a cloud database.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Build a Database using the **Free (M0) Tier**.
3. Create a Database User (give it a username and secure password).
4. Under "Network Access" in the left sidebar, add `0.0.0.0/0` to allow connections from anywhere (required so your backend can reach it).
5. Click **Connect** on your Database cluster, select **Drivers**, and copy the Connection String.
   - It will look like this: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
   - **Important**: Replace `<password>` with the password you just created, and add the database name right before the `?` like this: `mongodb.net/qatest?retryWrites...`
6. Save this connection string—you need it for Step 2!

---

## Step 2: Deploy the Backend to Render.com

Render is a modern alternative to Heroku that makes hosting Node.js apps very easy.

1. Create a GitHub repository and push your entire `QA_Test` folder to it.
2. Go to [Render.com](https://render.com/) and create a free account logging in with GitHub.
3. Click **New +** and select **Web Service**.
4. Connect the GitHub repository you just created.
5. In the Render configuration settings:
   - **Name**: `kadellabs-ld-backend`
   - **Root Directory**: `backend` (very important, since the code is inside this folder)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Scroll down to **Environment Variables** and add the following two keys:
   - `MONGO_URI`: (Paste the connection string from Step 1)
   - `JWT_SECRET`: (Type any random secret phrase, e.g., `kadellabs_super_secret_2026`)
7. Click **Create Web Service**. 
8. It will take a few minutes to build. Once it turns green ("Live"), copy your backend service URL! (e.g., `https://kadellabs-ld-backend.onrender.com`).

---

## Step 3: Deploy the Frontend to Vercel

Vercel is the fastest and best place to host React (Vite) applications.

1. You already have all your code on GitHub from Step 2.
2. Go to [Vercel.com](https://vercel.com/) and create an account using your GitHub.
3. Click **Add New** -> **Project**.
4. Import your `QA_Test` repository.
5. In the "Configure Project" step:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `frontend` 
6. Open the **Environment Variables** section and add:
   - Name: `VITE_API_URL`
   - Value: `https://kadellabs-ld-backend.onrender.com/api` (Use the URL you got from Render, and make sure it ends with `/api` and has no trailing slash).
7. Click **Deploy**.
8. Within a minute, Vercel will give you a live public URL (e.g., `https://kadellabs-frontend.vercel.app`).

### Important: Fixing React Router on Vercel
Because React handles its own routing, you need to tell Vercel to redirect all traffic to `index.html`. 
1. In your local `frontend` folder, create a new file named `vercel.json`.
2. Add this code inside it:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
3. Commit and push this change to GitHub. Vercel will automatically redeploy.

---

## Step 4: Final Testing

1. Go to your new live Vercel URL.
2. You should see the KadelLabs Candidate Login!
3. Go to `https://[your-vercel-url].vercel.app/admin`.
4. Register your Admin account. Since it's a completely new cloud database, you need to create your account again.
5. Create a test and try to import the Excel sheet. Because Render's free tier has a temporary filesystem, your Excel File import will still work fine because we process it entirely in memory using Multer!

**You are now live worldwide!** 🌍 
