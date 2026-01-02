# Finance App with Backend Sync

Your finance app now has **TWO MODES**:

## Mode 1: Offline Only (Current - No Changes Needed)
- Data stored locally in browser (IndexedDB)
- Works completely offline
- Each device has its own separate data
- **No setup required** - this is how it works now

## Mode 2: With Backend Sync (New Feature)
- Data syncs across all your devices
- Requires running the API server
- All devices see the same data in real-time

---

## 🚀 How to Enable Sync Across Devices

### Step 1: Start the API Server (on your computer)

```bash
cd /home/mikonimo/finance-app/server
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
PORT=3005 npm start
```

The server will start on:
- **Local**: http://localhost:3005
- **Network**: http://172.17.1.167:3005

### Step 2: Update Frontend to Use API

You need to modify the database operations to use the API instead of IndexedDB.

**Option A: Quick Test** - Update the API URL in the frontend:
1. The API utility is already created at `src/utils/api.ts`
2. You can test it by modifying components to use `api.accounts.create()` instead of `db.accounts.add()`

**Option B: Full Integration** - I can help you update all components to use the API

---

## 📱 Access from Your Phone

Once the server is running, access from your phone using:
- **http://172.17.1.167:3005/api/health** (to test server is running)
- **Frontend**: http://172.17.1.167:3002 (the Vite dev server)

Both devices must be on the **same WiFi network**.

---

## 🔄 How Sync Works

### Current Setup (Without Sync):
```
Phone Browser ────────> Local IndexedDB (Phone only)
Computer Browser ────> Local IndexedDB (Computer only)
```

### With Backend Sync:
```
Phone Browser ────────┐
                      ├──> API Server ──> SQLite Database
Computer Browser ─────┘

All devices read/write to the same database!
```

---

## API Endpoints Available

The server provides these endpoints:

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Sync
- `GET /api/sync?since=<timestamp>` - Get all changes since timestamp
- `POST /api/sync/push` - Push multiple changes at once

---

## 🔐 Security Note

**Current setup is for local network only!**

For production use, you would need:
- HTTPS/SSL certificates
- User authentication
- Password protection
- Cloud hosting (AWS, DigitalOcean, etc.)

---

## Next Steps

**Do you want me to:**
1. Update the frontend to automatically use the API server?
2. Add a toggle to switch between offline and online modes?
3. Keep it simple with manual sync buttons?

Let me know how you'd like to proceed!
