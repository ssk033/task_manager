# Locally kaise chalayein

## 1. Pehli baar / fresh start

```powershell
cd D:\dev\todo-list
npm install
```

**.env banao** (agar nahi hai):
- `.env.example` copy karke `.env` banao
- `.env` mein `DATABASE_URL` (Neon) aur `SESSION_SECRET` daalo

**DB tables ek baar:**
```powershell
npm run init-db
```

## 2. Server start

```powershell
npm start
```

Browser mein: **http://localhost:3000**

---

## Agar error: "address already in use :::3000"

Port 3000 pehle se use ho raha hai. Do options:

### Option A: Jo 3000 use kar raha hai use band karo

PowerShell (Admin ho to better):

```powershell
# Dekho kaun process 3000 use kar raha hai
netstat -ano | findstr :3000
```

Jo **PID** (last column) dikhe, use kill karo:

```powershell
taskkill /PID <number> /F
```

Example: agar PID 12345 hai to `taskkill /PID 12345 /F`

### Option B: Alag port use karo

```powershell
$env:PORT=3001; npm start
```

Phir browser mein: **http://localhost:3001**

---

## Commands yaad rahein

| Command        | Kaam              |
|----------------|-------------------|
| `npm start`    | Server start      |
| `npm run dev`  | Server + auto reload |
| `npm run init-db` | DB tables (sirf ek baar) |

`npm run` sirf scripts ki list dikhata hai, server start **nahi** karta.
