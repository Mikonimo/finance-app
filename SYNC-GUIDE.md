# 🔄 How to Sync Data Between Devices

Your Finance Manager now has **Manual Sync Buttons**! 

## 📍 Where to Find Sync Controls

1. Open the app
2. Go to **Settings** tab (bottom navigation)
3. You'll see a **"Sync with Server"** panel at the top

## 🔘 Three Sync Buttons

### 📥 Pull from Server
- Downloads data FROM the server TO your device
- Use this when: Another device added data you want to see

### 📤 Push to Server
- Uploads YOUR local data TO the server
- Use this when: You added accounts/transactions and want other devices to see them

### 🔄 Full Sync (Recommended)
- First pulls, then pushes
- Best option to keep everything in sync
- Use this most of the time!

---

## 🚀 Quick Start Guide

### First Time Setup (Do this on EACH device):

1. **On your computer:**
   - App is at: http://localhost:3002/
   - Add some accounts and transactions
   - Go to Settings → Click **"Push to Server"**
   - ✅ Your data is now on the server!

2. **On your phone:**
   - Open: http://172.17.1.167:3002/
   - Go to Settings → Click **"Pull from Server"**
   - ✅ You'll see all the computer's data!

3. **Going forward:**
   - Add data on ANY device
   - Click **"Full Sync"** button
   - Data appears on ALL devices!

---

## 💡 Best Practices

### ✅ Do This:
- Click "Full Sync" before and after making changes
- Use "Full Sync" when switching devices
- Check the success message to confirm sync worked

### ⚠️ Avoid This:
- Don't add data on both devices without syncing first
- Don't close the server (keep it running)
- If sync fails, check that both servers are running

---

## 🔧 Both Servers Must Be Running

Make sure these are both active:

**Frontend (The App):**
```bash
cd /home/mikonimo/finance-app
npm run dev -- --host
```
- Running on: http://172.17.1.167:3002/

**Backend (Data Server):**
```bash
cd /home/mikonimo/finance-app/server
PORT=3005 npm start
```
- Running on: http://172.17.1.167:3005/

---

## 🐛 Troubleshooting

### "Push failed" or "Pull failed" error?
1. Check both servers are running
2. Try refreshing the page
3. Check Settings panel shows correct server URL

### Data not appearing after sync?
1. Wait a few seconds and refresh the page
2. Try "Full Sync" instead of just pull/push
3. Check the success message shows items were transferred

### Phone can't connect?
1. Make sure phone is on same WiFi as computer
2. Use the network IP (172.17.1.167), not localhost
3. Check your computer's firewall isn't blocking ports 3002 and 3005

---

## 🎉 That's It!

Your data now syncs manually when you click the buttons. Simple and in your control!

**Quick Workflow:**
1. Open app on any device
2. Add transactions/accounts
3. Go to Settings
4. Click "Full Sync"
5. Done! ✨
