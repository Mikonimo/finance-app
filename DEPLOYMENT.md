# Finance App Deployment Guide

## Data Persistence Issue

**Why data is lost on dev server restart:**
- IndexedDB data is stored in your browser (persists across page refreshes)
- Data only resets if you clear browser data or use incognito mode
- To prevent data loss, **use the Sync feature** to backup data to the server

**How to keep your data safe:**
1. Use the "Push to Server" button in Settings to backup your data
2. Use "Pull from Server" to restore data if needed
3. Use "Full Sync" to keep both in sync

---

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) - RECOMMENDED

#### Backend Deployment (Railway)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   cd server
   # Create railway.json
   echo '{
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "node server.js",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }' > railway.json
   ```

3. **Push to Railway**
   - Create new project in Railway dashboard
   - Connect your GitHub repository
   - Railway will auto-detect Node.js and deploy
   - Copy the generated URL (e.g., https://your-app.up.railway.app)

4. **Set Environment Variables** (if needed)
   - PORT: 3005 (Railway sets this automatically)

#### Frontend Deployment (Vercel)

1. **Update API URL**
   ```bash
   # In src/utils/api.ts, update the baseURL
   const API_URL = process.env.VITE_API_URL || 'https://your-railway-backend.up.railway.app';
   ```

2. **Build Production**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Set Environment Variables:
     - `VITE_API_URL`: Your Railway backend URL
   - Click "Deploy"

4. **Done!** Your app is live at https://your-app.vercel.app

---

### Option 2: DigitalOcean App Platform (All-in-One)

1. **Create DigitalOcean Account**
   - Go to https://www.digitalocean.com/products/app-platform

2. **Create App**
   - Click "Create App"
   - Connect GitHub repository
   - Configure two components:

   **Component 1: Backend (Node.js)**
   - Source: `/server`
   - Build Command: `npm install`
   - Run Command: `node server.js`
   - HTTP Port: 3005
   - Plan: Basic ($5/month)

   **Component 2: Frontend (Static Site)**
   - Source: `/`
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - Plan: Free

3. **Environment Variables**
   - Backend: None needed (uses default PORT)
   - Frontend: `VITE_API_URL` = your backend URL

4. **Deploy**
   - DigitalOcean will build and deploy both
   - Access your app at the provided URL

---

### Option 3: Self-Hosted (VPS)

#### Prerequisites
- Ubuntu 20.04+ server
- Domain name (optional)
- SSH access

#### Steps

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

3. **Clone Repository**
   ```bash
   cd /var/www
   git clone <your-repo-url> finance-app
   cd finance-app
   ```

4. **Setup Backend**
   ```bash
   cd server
   npm install
   pm2 start server.js --name finance-api
   pm2 save
   pm2 startup
   ```

5. **Setup Frontend**
   ```bash
   cd ..
   npm install
   npm run build
   ```

6. **Install Nginx**
   ```bash
   sudo apt install nginx
   ```

7. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/finance-app
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # or server IP

       # Frontend
       location / {
           root /var/www/finance-app/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3005;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/finance-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Setup SSL (Optional but Recommended)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

10. **Done!** Access your app at http://your-domain.com

---

## Environment Variables Reference

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend-url.com
```

### Backend (.env)
```bash
PORT=3005
NODE_ENV=production
```

---

## Post-Deployment Checklist

- [ ] Test all features (accounts, transactions, budgets, etc.)
- [ ] Test sync functionality (push/pull data)
- [ ] Test recurring transactions generation
- [ ] Test net worth snapshots
- [ ] Test on mobile devices
- [ ] Test PWA installation
- [ ] Check browser console for errors
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up backups for SQLite database
- [ ] Monitor server logs

---

## Backup Strategy

### Manual Backup
1. Use "Export Data" in Settings to download JSON
2. Store in safe location (Google Drive, Dropbox, etc.)

### Server Backup
```bash
# Backup SQLite database
cp /var/www/finance-app/server/finance.db ~/backups/finance-$(date +%Y%m%d).db

# Setup automatic backups (cron)
crontab -e
# Add: 0 0 * * * cp /var/www/finance-app/server/finance.db ~/backups/finance-$(date +\%Y\%m\%d).db
```

---

## Troubleshooting

### Data not persisting
- Check if browser allows IndexedDB (not in incognito mode)
- Use Sync feature to backup to server
- Check browser storage settings

### API connection errors
- Verify backend is running
- Check VITE_API_URL environment variable
- Check CORS settings in server.js
- Verify firewall allows port 3005

### Build errors
- Run `npm install` to update dependencies
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version (requires v20+)

---

## Cost Estimates

### Free Options
- Vercel Frontend: Free
- Railway Backend: Free tier ($5 credit/month)
- **Total: FREE** (for hobby projects)

### Paid Options
- Vercel Pro: $20/month (optional)
- Railway Pro: $5-20/month (depending on usage)
- DigitalOcean: $5-12/month
- Self-hosted VPS: $5-10/month

---

## Sharing with Others

Once deployed, users can:
1. Access your deployed URL
2. Create their own accounts (data is isolated per device)
3. Install as PWA for offline access
4. Sync their data to the server for backup

**Note:** Each user's data is stored locally in their browser. The server is only used for syncing/backup, not as a centralized database.
