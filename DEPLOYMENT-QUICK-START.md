# 🚀 Quick Start: Deploy to Vercel

**Your project is on GitHub!** Now deploy it to Vercel in 5 minutes.

---

## ✅ Step 1: Go to Vercel (2 min)

1. Visit https://vercel.com
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

---

## ✅ Step 2: Import Project (1 min)

1. Click **"Add New..."** → **"Project"**
2. Find **"eagletravelerp"** in the list
3. Click **"Import"**

---

## ✅ Step 3: Add Environment Variables (1 min)

**CRITICAL:** Add these in Vercel:

**Variable 1:**
```
Name: VITE_SUPABASE_URL
Value: [Copy from your .env.local file]
Environment: Production ✓ Preview ✓ Development ✓
```

**Variable 2:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: [Copy from your .env.local file]
Environment: Production ✓ Preview ✓ Development ✓
```

---

## ✅ Step 4: Deploy (1 min)

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Done! 🎉

Your site will be live at:
```
https://eagletravelerp.vercel.app
```

---

## ✅ Step 5: Setup Database (Required!)

**Before using your deployed site:**

1. Go to Supabase Dashboard (https://supabase.com)
2. Open SQL Editor → New Query
3. Run `supabase-schema.sql` from your project
4. Run `fix-schema-missing-columns.sql` from your project
5. Done!

---

## 🎯 That's It!

Your Eagle Travel ERP is now live!

**GitHub:** https://github.com/Syed-Moinuddin8/eagletravelerp  
**Vercel:** https://eagletravelerp.vercel.app (your deployment)

### Auto-Deploy Enabled
Every time you push to GitHub, Vercel automatically deploys the new version!

```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel deploys automatically in 2-3 minutes
```

---

## 📚 Full Documentation

- **Complete Guide:** See `VERCEL-DEPLOYMENT-GUIDE.md`
- **Deployment Info:** See `DEPLOYMENT-GUIDE.md`
- **Project Setup:** See `README.md`

---

**Need Help?**
- Check `VERCEL-DEPLOYMENT-GUIDE.md` for detailed troubleshooting
- Vercel Support: https://vercel.com/support

**Ready? Go deploy!** 🚀
