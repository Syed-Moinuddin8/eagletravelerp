# Environment Variables for Vercel Deployment 🔐

Complete guide for adding environment variables to Vercel.

---

## ✅ REQUIRED ENVIRONMENT VARIABLES (2 Variables)

You **MUST** add these two variables for your app to work:

### 1. VITE_SUPABASE_URL
**Value:** `https://dmvuvtfnajvgzlotstga.supabase.co`

**What it is:** Your Supabase project URL  
**Why needed:** Connects your app to Supabase database  
**Environment:** Production ✓ Preview ✓ Development ✓

### 2. VITE_SUPABASE_ANON_KEY
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdnV2dGZuYWp2Z3psb3RzdGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MDYxOTIsImV4cCI6MjEwMDM4MjE5Mn0.UY0r6BaP78EVW4_f9OPFi3IY14YVRTjww5yWNSdfd0s`

**What it is:** Your Supabase anonymous/public API key  
**Why needed:** Authenticates requests to Supabase  
**Environment:** Production ✓ Preview ✓ Development ✓

---

## 🚫 OPTIONAL VARIABLE (Not Required for Now)

### 3. GEMINI_API_KEY (NOT NEEDED)
**Status:** Not currently used in the application  
**Action:** Skip this variable - don't add it to Vercel

---

## 📋 HOW TO ADD IN VERCEL

### Step-by-Step Instructions

**Step 1:** In Vercel, during project import or in project settings

**Step 2:** Find "Environment Variables" section

**Step 3:** Click "Add" or "New Variable"

**Step 4:** Add Variable 1
```
Name:  VITE_SUPABASE_URL
Value: https://dmvuvtfnajvgzlotstga.supabase.co

Environments: [✓] Production  [✓] Preview  [✓] Development
```

**Step 5:** Click "Add" or "Save"

**Step 6:** Add Variable 2
```
Name:  VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdnV2dGZuYWp2Z3psb3RzdGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MDYxOTIsImV4cCI6MjEwMDM4MjE5Mn0.UY0r6BaP78EVW4_f9OPFi3IY14YVRTjww5yWNSdfd0s

Environments: [✓] Production  [✓] Preview  [✓] Development
```

**Step 7:** Click "Add" or "Save"

**Step 8:** Click "Deploy" or "Redeploy"

---

## 📸 VISUAL GUIDE

### In Vercel Dashboard

```
┌─────────────────────────────────────────────┐
│ Environment Variables                       │
├─────────────────────────────────────────────┤
│                                             │
│ Name: VITE_SUPABASE_URL                    │
│ Value: https://dmvuvtfnajvgzlotstga.su...  │
│                                             │
│ Environments:                               │
│ [✓] Production                              │
│ [✓] Preview                                 │
│ [✓] Development                             │
│                                             │
│                           [Save]            │
├─────────────────────────────────────────────┤
│                                             │
│ Name: VITE_SUPABASE_ANON_KEY               │
│ Value: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...  │
│                                             │
│ Environments:                               │
│ [✓] Production                              │
│ [✓] Preview                                 │
│ [✓] Development                             │
│                                             │
│                           [Save]            │
└─────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST

Add to Vercel:
- [ ] VITE_SUPABASE_URL = `https://dmvuvtfnajvgzlotstga.supabase.co`
- [ ] VITE_SUPABASE_ANON_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key)
- [ ] Both selected for: Production, Preview, Development
- [ ] Saved/Added successfully

Do NOT add:
- [ ] GEMINI_API_KEY (not needed)

---

## 🔐 SECURITY NOTES

### These Keys Are Safe to Use in Frontend
✅ **VITE_SUPABASE_URL** - Public URL, safe to expose  
✅ **VITE_SUPABASE_ANON_KEY** - Anonymous key, designed for client-side use

### Why They're Safe
- Supabase's Row Level Security (RLS) protects your data
- Anonymous key has limited permissions
- These keys are meant for frontend applications

### Never Commit to GitHub
❌ Your `.env.local` file is in `.gitignore`  
❌ Keys are NOT in your GitHub repository  
✅ Keys only in Vercel environment variables

---

## 🔍 WHERE TO FIND YOUR KEYS (If You Need to Check)

### In Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **dmvuvtfnajvgzlotstga**
3. Click **Settings** (gear icon)
4. Click **API** in sidebar
5. You'll see:
   - **Project URL** = `VITE_SUPABASE_URL`
   - **Project API keys** → **anon** **public** = `VITE_SUPABASE_ANON_KEY`

---

## 🧪 TEST YOUR VARIABLES

After adding variables and deploying:

### Test 1: Site Loads
- Visit your Vercel URL
- Site should load without errors

### Test 2: Database Connection
- Open browser console (F12)
- Look for: "✅ Data loaded from Supabase"
- No errors about "VITE_SUPABASE_URL not defined"

### Test 3: Data Operations
- Try adding a customer
- If it saves, variables are working! ✅

---

## 🐛 TROUBLESHOOTING

### Build Fails: "VITE_SUPABASE_URL is not defined"
**Problem:** Environment variable not added or named incorrectly  
**Solution:** 
- Check spelling: `VITE_SUPABASE_URL` (exact case)
- Ensure value has no extra spaces
- Verify you clicked "Save"

### Build Succeeds but Site Shows Errors
**Problem:** Variables not selected for all environments  
**Solution:**
- Edit variables in Vercel
- Ensure all 3 checkboxes selected: Production, Preview, Development

### "Failed to connect to Supabase"
**Problem:** Wrong URL or key  
**Solution:**
- Double-check values match `.env.local` exactly
- Copy-paste to avoid typos
- Remove any trailing spaces

---

## 📊 SUMMARY

### What You Need
| Variable Name | Value | Required |
|---------------|-------|----------|
| VITE_SUPABASE_URL | https://dmvuvtfnajvgzlotstga.supabase.co | ✅ Yes |
| VITE_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... | ✅ Yes |
| GEMINI_API_KEY | - | ❌ No |

### Total Variables to Add: **2**

---

## 🎯 QUICK COPY-PASTE

For easy copy-paste into Vercel:

**Variable 1:**
```
Name: VITE_SUPABASE_URL
Value: https://dmvuvtfnajvgzlotstga.supabase.co
```

**Variable 2:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdnV2dGZuYWp2Z3psb3RzdGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MDYxOTIsImV4cCI6MjEwMDM4MjE5Mn0.UY0r6BaP78EVW4_f9OPFi3IY14YVRTjww5yWNSdfd0s
```

---

## ✅ VERIFICATION

After adding variables:

**In Vercel:**
- [ ] 2 environment variables added
- [ ] Both have correct names (case-sensitive)
- [ ] Both have correct values (no extra spaces)
- [ ] All 3 environments selected
- [ ] Variables saved

**After Deploy:**
- [ ] Site builds successfully
- [ ] Site loads at Vercel URL
- [ ] No console errors about missing variables
- [ ] Can create/save data

---

## 🎉 YOU'RE READY!

**With these 2 variables, your app will:**
- ✅ Connect to Supabase database
- ✅ Save and load data correctly
- ✅ Work in production just like locally

**Just add the 2 variables and deploy!** 🚀

---

**Need Help?**
- Check Vercel docs: https://vercel.com/docs/environment-variables
- Check values in your `.env.local` file
- Ensure exact spelling and no extra spaces
