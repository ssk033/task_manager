# Vercel par 404 fix – ye steps zaroor karo

Jab **GET /api/auth/me** ya koi bhi `/api/*` par **404** aaye, matlab backend deploy nahi hua.

## 1. Vercel Project Settings (sabse zaroori)

1. **Vercel Dashboard** → apna project (task-manager-rit) → **Settings**
2. **Build & Development** section mein jao
3. **Framework Preset:** **Other** select karo (Vite / Create React App mat rakhna)
4. **Output Directory:** **khali chhodo** (kuch mat likho). Agar "public" ya "dist" likha hai to **delete karke save** karo.  
   → Output Directory set hone se sirf wohi folder deploy hota hai, `api/` nahi jati, isliye 404 aata hai.
5. **Build Command:** khali ya `npm run build` (agar tumhara koi build nahi hai to khali bhi chalega)
6. **Install Command:** khali (default `npm install` chalega)

Save karo.

## 2. Environment Variables

**Settings** → **Environment Variables** → ye add karo:

| Name | Value |
|------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon connection string |
| `SESSION_SECRET` | koi bhi long random string |

Save karo.

## 3. Redeploy

- **Deployments** tab → latest deployment pe **⋮** (three dots) → **Redeploy**
- "Use existing Build Cache" **uncheck** karke redeploy karo

## 4. Check karo

Redeploy ke baad:

- **Deployments** → us deployment pe click → **Functions** / **Resources** tab  
  Wahan **api** ya **api/index** dikhna chahiye. Agar nahi dikh raha to phir bhi API deploy nahi hui.
- Browser mein: `https://task-manager-rit.vercel.app/api/health`  
  Agar `{"ok":true}` aaye to backend chal raha hai.

---

**Short:** 404 fix karne ke liye **Output Directory ko khali karo** aur **Redeploy** karo.
