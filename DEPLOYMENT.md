# GeniusLab - Automatic Deployment Setup

## 🚀 Auto-Deploy from GitHub to Vercel

This guide shows you how to set up automatic deployment so that every time you push to GitHub, your site automatically deploys to geniuslabz.xyz.

### Step 1: Sign Up for Vercel (Free)

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your GitHub Repository

1. Once logged in, click "Add New..." → "Project"
2. Find your `geniuslab` repository
3. Click "Import"

### Step 3: Configure Project Settings

Vercel should auto-detect everything, but verify:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

Click "Environment Variables" and add:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

(Get these from your `.env` file)

### Step 5: Deploy

1. Click "Deploy"
2. Wait ~2 minutes for first deployment
3. You'll get a URL like: `geniuslab-xyz.vercel.app`

### Step 6: Connect Your Custom Domain

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your domain: `geniuslabz.xyz`
4. Vercel will give you DNS records to update
5. Go to your domain registrar (where you bought geniuslabz.xyz)
6. Update DNS records as instructed by Vercel
7. Wait 5-48 hours for DNS propagation

### 🎉 Done! Now Every Git Push Auto-Deploys

From now on:
1. Make changes to your code
2. Run: `git add . && git commit -m "your message" && git push`
3. Vercel automatically builds and deploys in ~1 minute
4. Your site at geniuslabz.xyz updates automatically!

## Alternative: Netlify

If you prefer Netlify instead:

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose your GitHub repo
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables
7. Deploy!

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
