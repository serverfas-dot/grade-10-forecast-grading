# Grade 10 Student Forecast Grading System

A web app for teachers to submit forecast grades and administrators to manage students, subjects, grades, and view results.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, authentication, row-level security)
- **Icons**: Lucide React

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Supabase](https://supabase.com) account (free tier works)

## Local Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the template and fill in your Supabase credentials:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your real values:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   Both values come from your Supabase dashboard: **Settings → API**.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

4. **Build for production**

   ```bash
   npm run build
   ```

   The built site lands in the `dist/` folder.

## Database Setup

The Supabase migrations in `supabase/migrations/` create all required tables, policies, and the `submit_forecast` function. If you are setting up a fresh Supabase project, run these SQL files in order through the Supabase SQL Editor.

## Environment Variables

| Variable | Description | Where to Find |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | The anonymous public key for the browser client | Supabase dashboard → Settings → API → Project API keys (anon public) |

> **Note**: The anon key is safe to expose in frontend code. It only allows access that your row-level security policies explicitly grant. Never use the service role key in frontend code.

## Deploying to GitHub

1. **Initialize a Git repository**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a repository on GitHub**

   Go to [github.com/new](https://github.com/new), name it, and leave it empty (don't add a README).

3. **Push your code**

   ```bash
   git remote add origin https://github.com/your-username/your-repo.git
   git branch -M main
   git push -u origin main
   ```

   Or use the GitHub Desktop app for a no-command-line experience.

## Hosting Options

### Option A: Bolt Hosting (easiest)

1. Open your project in Bolt.
2. Click **Publish** in the top-right corner.
3. Click **Publish** again and wait about a minute.
4. Your site goes live on a Bolt-hosted URL.

Source: https://support.bolt.new/cloud/hosting/publish

### Option B: Netlify

1. Push your code to GitHub (see above).
2. Go to [app.netlify.com](https://app.netlify.com) and sign in with GitHub.
3. Click **Add new site → Import an existing project**.
4. Select your repository.
5. Set build command to `npm run build` and publish directory to `dist`.
6. Add environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) under **Site settings → Environment variables**.
7. Click **Deploy**.

### Option C: Vercel

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **Add New → Project** and import your repository.
4. Vercel auto-detects Vite. Add the environment variables in the setup screen.
5. Click **Deploy**.

## Admin Access

The first admin must be added to the `forecast_admins` table manually via the Supabase SQL Editor:

```sql
INSERT INTO forecast_admins (user_id)
SELECT id FROM auth.users WHERE email = 'your-admin@email.com';
```

After that, the admin can sign in through the admin login page.
