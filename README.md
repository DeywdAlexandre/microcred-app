# MicroCred - Loan Management App

This is the main project for the MicroCred application, a full-stack solution for managing clients and loans with Google Sheets integration.

## Project Structure

The project is structured for a modern development workflow with Vite and a serverless backend.

- `/src`: Contains all the frontend source code (React components, TypeScript types, etc.).
- `/api`: Contains the backend serverless function (`index.js`).
- **Root**: Contains configuration files (`vite.config.js`, `package.json`, etc.) and the main `index.html`.

## Setup & Local Development

Follow these steps to run the application on your local machine.

### 1. Install Dependencies

First, you need to install all the necessary packages for both the frontend and backend. Open your terminal in the **root directory** of the project and run:

```bash
npm install
```

This will create a `node_modules` folder and install everything needed.

### 2. Create your Environment File (`.env`)

The application requires API keys to connect to Google services.

1.  **Find the file `altere.txt`** in the root directory.
2.  **Make a copy** of this file and **rename the copy to `.env`**.
3.  **Open the new `.env` file** and replace the placeholder values with your actual credentials from the Google Cloud Console.

**For local development, your `REDIRECT_URI` should be `http://localhost:8080/api/auth/google/callback`.**

### 3. Run Everything!

With dependencies installed and your `.env` file configured, you only need one command. In your terminal (at the project root), run:

```bash
npm start
```

This command will simultaneously:
1.  Start the **Vite development server** for the frontend (usually on `http://localhost:5173`).
2.  Start the **backend API server** on `http://localhost:8080`.

Open the frontend URL provided in the terminal (`http://localhost:5173`) in your browser to see the application live.

**IMPORTANT:** Do **NOT** use the "Live Server" extension from VS Code anymore. The `npm start` command handles everything.

## Deployment to Vercel

The project is pre-configured for easy deployment to Vercel.

1.  **Push to GitHub:** Make sure your project is on a GitHub repository.
2.  **Import to Vercel:** Log in to your Vercel account, import the GitHub repository. Vercel should automatically detect it as a Vite project.
3.  **Configure Environment Variables:** Before deploying, go to your Vercel project's settings and add all the variables from your `.env` file.
4.  **Update `REDIRECT_URI` and `FRONTEND_URL`:** After the first deployment, Vercel will give you a public URL (e.g., `https://my-app.vercel.app`).
    - Go back to your Google Cloud Console and add `https://my-app.vercel.app/api/auth/google/callback` to your authorized redirect URIs.
    - Go back to your Vercel environment variables and update `REDIRECT_URI` to this new URL, and `FRONTEND_URL` to `https://my-app.vercel.app`.
5.  **Redeploy:** Vercel will automatically trigger a new deployment. Your application will then be live.