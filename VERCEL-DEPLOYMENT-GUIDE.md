# Vercel Deployment Guide 🚀

Complete step-by-step guide to deploy Eagle Travel ERP to Vercel.

---

## ✅ Prerequisites Complete

- [x] Code pushed to GitHub: https://github.com/Syed-Moinuddin8/eagletravelerp
- [x] Vercel configuration file created: `vercel.json`
- [x] Build successful locally
- [x] Environment variables ready

---

## 🚀 Deployment Steps

### Step 1: Sign Up/Login to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" (or "Login" if you have an account)
3. **Choose "Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your Project

1. After login, click **"Add New..."** → **"Project"**
2. You'll see your GitHub repositories
3. Find **"eagletravelerp"** in the list
4. Click **"Import"**

### Step 3: Configure Project

Vercel will automatically detect:
- ✅ Framework: Vite
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

**Don't change these - they're correct!**

### Step 4: Add Environment Variables

This is CRITICAL! Click **"Environment Variables"** section:

Add these two variables:

**Variable 1:**
- Name: `VITE_SUPABASE_URL`
- Value: Your Supabase project URL (from `.env.local`)
- Environment: Production, Preview, Development (select all)

**Variable 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: Your Supabase anon key (from `.env.local`)
- Environment: Production, Preview, Development (select all)

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see "🎉 Congratulations!" when done

### Step 6: Get Your URL

After deployment, you'll get a URL like:
```
https://eagletravelerp.vercel.app
```

Or with a custom subdomain:
```
https://eagletravelerp-yourusername.vercel.app
```

---

## 🔧 Post-Deployment Setup

### 1. Run Database Migrations

**IMPORTANT:** Your Supabase database needs the schema setup!

If you haven't already:
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase-schema.sql` (creates all tables)
3. Run `fix-schema-missing-columns.sql` (adds required columns)

### 2. Test Your Deployment

1. Open your Vercel URL
2. Check if the site loads
3. Try logging in (if authentication is set up)
4. Test creating a customer, driver, or vehicle
5. Verify data saves to Supabase

### 3. Configure Custom Domain (Optional)

1. In Vercel Dashboard → Your Project
2. Go to **Settings** → **Domains**
3. Click **"Add"**
4. Enter your domain (e.g., `erp.yourdomain.com`)
5. Follow DNS configuration instructions

---

## 📋 Environment Variables Reference

Your `.env.local` has these values (copy them to Vercel):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find them:**
1. Supabase Dashboard
2. Settings → API
3. Project URL = `VITE_SUPABASE_URL`
4. Project API keys → anon/public = `VITE_SUPABASE_ANON_KEY`

---

## 🔄 Automatic Deployments

Vercel automatically deploys when you push to GitHub!

**How it works:**
1. You make changes locally
2. Commit: `git commit -m "Your changes"`
3. Push: `git push origin main`
4. Vercel automatically builds and deploys
5. New version live in 2-3 minutes!

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found" or "Cannot find package"
**Solution:** Check `package.json` has all dependencies

**Error:** "Environment variable not found"
**Solution:** Add missing environment variables in Vercel dashboard

### Site Loads but Shows Errors

**Error:** "Could not connect to database"
**Solution:** 
1. Check environment variables are set correctly
2. Verify Supabase URL and key are correct
3. Check Supabase project is not paused

**Error:** "Could not find column"
**Solution:** Run database migrations in Supabase SQL Editor

### Data Not Saving

**Problem:** Can see data but can't save
**Solution:**
1. Check Supabase RLS (Row Level Security) settings
2. Run `disable-rls.sql` if in development
3. Verify database migrations are complete

---

## 📊 Vercel Dashboard Features

### Deployments Tab
- See all deployments
- View build logs
- Roll back to previous versions

### Analytics Tab (if enabled)
- View visitor statistics
- Monitor performance
- Track page views

### Settings Tab
- Environment variables
- Custom domains
- Build & output settings

---

## 🔐 Security Checklist

Before going live:

- [ ] Environment variables set in Vercel
- [ ] `.env.local` NOT committed to GitHub (check!)
- [ ] Supabase RLS configured (if needed)
- [ ] Database migrations run
- [ ] Test all features work in production
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active (automatic with Vercel)

---

## 🎯 Quick Commands

### Deploy New Version
```bash
git add .
git commit -m "Update description"
git push origin main
```

### View Deployment Logs
1. Vercel Dashboard → Your Project
2. Click on latest deployment
3. View build logs

### Roll Back Deployment
1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## 💡 Pro Tips

### Tip 1: Use Preview Deployments
Every branch gets its own preview URL for testing!

```bash
git checkout -b feature-name
# Make changes
git push origin feature-name
# Vercel creates preview URL automatically
```

### Tip 2: Set Up Aliases
Add custom URLs for specific branches:
- `main` → `https://eagletravelerp.vercel.app`
- `develop` → `https://dev-eagletravelerp.vercel.app`

### Tip 3: Monitor Build Times
Check Analytics → Build Times to optimize performance

### Tip 4: Environment-Specific Variables
Use different Supabase projects for:
- Production: Live data
- Preview: Test data
- Development: Local testing

---

## 📞 Support Resources

### Vercel Documentation
- https://vercel.com/docs
- https://vercel.com/docs/frameworks/vite

### Supabase + Vercel
- https://supabase.com/docs/guides/hosting/vercel

### Troubleshooting
- Vercel Community: https://github.com/vercel/vercel/discussions
- Build logs in Vercel Dashboard

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] Code on GitHub
- [x] Vercel account created
- [x] Environment variables ready
- [x] Database migrations prepared

### During Deployment
- [ ] Import project from GitHub
- [ ] Configure build settings (auto-detected)
- [ ] Add environment variables
- [ ] Deploy

### Post-Deployment
- [ ] Run database migrations in Supabase
- [ ] Test site functionality
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/analytics

---

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Site loads at Vercel URL
- ✅ Can create/read/update data
- ✅ Settings persist
- ✅ Payment ledger works
- ✅ All features functional

---

## 📝 After Deployment

### Share Your ERP
Your live URL: `https://eagletravelerp.vercel.app`

### Monitor Performance
- Check Vercel Analytics
- Monitor Supabase usage
- Review error logs

### Keep Updated
```bash
# Make changes locally
npm run dev  # Test

# Push to GitHub
git add .
git commit -m "New features"
git push origin main

# Vercel auto-deploys in 2-3 minutes!
```

---

**Your Eagle Travel ERP is now live on Vercel!** 🚀

**Repository:** https://github.com/Syed-Moinuddin8/eagletravelerp  
**Deployment:** Follow steps above  
**Time to Deploy:** ~10 minutes  
**Auto-Deploy:** Yes (on every push to main)

---

**Ready to deploy? Let's go!** 🎉
