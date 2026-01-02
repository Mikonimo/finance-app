# Quick Setup Guide

## 🚀 Get Started in 3 Minutes

### 1. Install Dependencies (1 minute)
```bash
npm install
```

This installs:
- React + TypeScript
- Vite build tool
- Dexie.js for IndexedDB
- Recharts for charts
- Tailwind CSS for styling
- PWA plugin

### 2. Start Development Server (30 seconds)
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 3. Start Using! (Immediately)
The app is ready to use with:
- ✅ Pre-configured sample account
- ✅ Default categories (income & expenses)
- ✅ Fully functional dashboard
- ✅ All features enabled

## 📁 File Overview

**Only modify these files for customization:**

| File | Purpose |
|------|---------|
| `src/db/database.ts` | Add/modify default categories |
| `tailwind.config.js` | Change color scheme |
| `src/utils/finance.ts` | Adjust currency/date formats |
| `vite.config.ts` | PWA settings (name, theme) |

**Main app files (view only unless extending):**
- `src/components/` - All UI components
- `src/store/appStore.ts` - Global state
- `src/App.tsx` - Main app shell

## 🎨 Quick Customizations

### Change App Name
**File**: `vite.config.ts`
```typescript
manifest: {
  name: 'My Finance App',     // Change this
  short_name: 'MyFinance',    // And this
  // ...
}
```

### Change Primary Color
**File**: `tailwind.config.js`
```javascript
primary: {
  600: '#0ea5e9',  // Replace with your color
}
```

### Add Custom Category
**File**: `src/db/database.ts`
```typescript
{ 
  name: 'Your Category', 
  type: 'expense', 
  color: '#10b981', 
  isActive: true 
}
```

### Change Currency Symbol
**File**: `src/utils/finance.ts`
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',  // Change to EUR, GBP, etc.
  }).format(amount);
}
```

## 🏗️ Build for Production

### Create Optimized Build
```bash
npm run build
```

Output in `dist/` folder.

### Test Production Build Locally
```bash
npm run preview
```

### Deploy
Copy the `dist/` folder to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- Your own server
- Or just open `dist/index.html` locally!

## 📱 Install as App

### Desktop
1. Open the app in Chrome/Edge
2. Look for install icon (⊕) in address bar
3. Click to install
4. App appears as standalone application

### Mobile
**iOS:**
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"

**Android:**
1. Open in Chrome
2. Tap three dots menu
3. Select "Add to Home Screen"

## 🔧 Common Issues

### Port 3000 Already in Use
```bash
npm run dev -- --port 3001
```

### Build Fails
```bash
rm -rf node_modules
npm install
npm run build
```

### Data Disappeared
- Check browser isn't in incognito/private mode
- IndexedDB persists per browser profile
- Use export/import for backups

### Charts Not Showing
- Add some transactions first
- Transactions need categories
- Refresh the page

## 📊 Data Flow

```
User Action
    ↓
Component (React)
    ↓
Database Update (Dexie/IndexedDB)
    ↓
Live Query Hook (dexie-react-hooks)
    ↓
Component Re-renders
    ↓
UI Updates
```

All data changes are **reactive** and **instant**.

## 🎯 Next Steps

1. **Personalize**: Add your real accounts and categories
2. **Record**: Start adding transactions
3. **Budget**: Set monthly budgets for spending categories
4. **Analyze**: Review dashboard for insights
5. **Backup**: Export data regularly from Settings

## 💡 Tips for Best Experience

- **Daily Use**: Add transactions as they happen
- **Weekly Review**: Check budget progress in Budgets tab
- **Monthly Audit**: Export data and review trends
- **Regular Backups**: Export data monthly to safe location
- **Categories**: Keep categories simple and consistent
- **Descriptions**: Use clear, searchable transaction descriptions

## 🆘 Getting Help

1. **Check README.md** for detailed documentation
2. **Browser Console** (F12) shows errors
3. **DevTools → Application → IndexedDB** to inspect data
4. **Network Tab** should show zero requests (offline-first!)

---

**Ready?** Run `npm install && npm run dev` and start tracking your finances! 🎉