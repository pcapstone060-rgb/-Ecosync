# Hugging Face Spaces Deployment Guide - EcoSync Pro

Follow these steps to deploy your EcoSync Pro system to Hugging Face!

## 1. Create a New Space
1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. **Name**: `EcoSync-Pro` (or your preferred name).
3. **SDK**: Select **Docker**.
4. **Template**: Select **Blank**.
5. **Visibility**: Public (recommended for demo) or Private.
6. Click **Create Space**.

## 2. Configure Secrets
Hugging Face needs your database and email credentials to work securely.
1. In your new Space, go to **Settings** > **Variables and secrets**.
2. Under **Secrets**, add the following:
   - `DATABASE_URL`: Your PostgreSQL connection string (from Neon or Supabase).
   - `EMAIL_USER`: Your Gmail address.
   - `EMAIL_PASS`: Your Gmail App Password.
   - `SECRET_KEY`: A random secret string for security.
   - `ENVIRONMENT`: `production`

## 3. Upload Your Code
You can use the Hugging Face web interface or Git.

### Option A: Via Web UI
1. Go to the **Files** tab of your Space.
2. Drag and drop your **entire project folder** (excluding `venv` and `node_modules`).
3. **IMPORTANT**: Rename `Dockerfile.huggingface` to `Dockerfile` in the root directory.

### Option B: Via Git (Recommended)
```bash
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/EcoSync-Pro
git add .
# Copy Dockerfile.huggingface to Dockerfile
cp Dockerfile.huggingface Dockerfile
git commit -m "Add Hugging Face deployment config"
git push hf main
```

## 4. Verify
1. Once pushed, Hugging Face will automatically start the **Building** process.
2. After a few minutes, the status should change to **Running**.
3. You can now access your dashboard and API through the Space URL!

---
**Note**: Ensure your `DATABASE_URL` is accessible from the internet (e.g., Neon.tech or Supabase). Local SQLite files will not persist between Space restarts.
