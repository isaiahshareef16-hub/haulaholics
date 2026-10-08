# Haul-A-Holics — Card on File Setup Guide

## What This Does
Customers get a link → they enter their name, email, phone, and card → the card saves to your Square account → NO charge. You charge later when your crew confirms the load.

---

## Quick Start (5 minutes)

### Step 1: Install Node.js
If you don't have it: go to https://nodejs.org and download the LTS version. Install it.

### Step 2: Set Up the Project
Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
cd card-on-file
npm install
```

### Step 3: Add Your Square Credentials
Copy the example file and fill in your real keys:

```bash
cp .env.example .env
```

Open the `.env` file in any text editor and replace the placeholder values:

```
SQUARE_APPLICATION_ID=sq0idp-YourRealApplicationId
SQUARE_ACCESS_TOKEN=EAAYourRealAccessToken
SQUARE_LOCATION_ID=YourRealLocationId
SQUARE_ENVIRONMENT=production
```

**Where to find these:**
- Go to https://developer.squareup.com/apps
- Click your app (or create one)
- **Application ID** → on the app dashboard, "Sandbox" or "Production" tab
- **Access Token** → Production tab → "Production Access token"
- **Location ID** → go to your Square Dashboard → Settings → Locations → click your location → the ID is in the URL

### Step 4: Start the Server
```bash
npm start
```

You should see:
```
🚛 Haul-A-Holics Card on File server running on port 3000
   Open: http://localhost:3000
```

Open http://localhost:3000 in your browser to test it.

---

## Hosting (So Customers Can Reach It)

The page needs to be on the internet for customers to use it. Here are the easiest options:

### Option A: Railway (Recommended — Free to start)
1. Go to https://railway.app and sign up
2. Connect your GitHub (or push this folder to a GitHub repo)
3. Click "New Project" → "Deploy from GitHub repo"
4. Add your environment variables (the same 4 from your .env file) in Railway's settings
5. Railway gives you a URL like `haulaholics-card.up.railway.app`
6. That's the link Grace sends customers

### Option B: Render (Also free to start)
1. Go to https://render.com and sign up
2. New → Web Service → connect your repo
3. Add environment variables in Render's dashboard
4. Gets a URL like `haulaholics-card.onrender.com`

### Option C: Your Own Domain
After hosting on Railway or Render, you can connect a custom domain like `pay.haulaholics.com` through their dashboard.

---

## How Grace Uses It

1. During the booking call, Grace says the card-on-file disclosure (from the SOP)
2. After the call, she texts/emails the customer the link
3. Customer opens the link, fills in their info, saves their card
4. Card appears in your Square Customer directory — ready to charge when the crew confirms the load

---

## Security Notes

- Your **Access Token** is the only secret — it lives in `.env` on your server, never in the browser
- Square's SDK handles all card encryption — you never see full card numbers
- The `.env` file is in `.gitignore` so it won't accidentally get pushed to GitHub
- All card data goes directly from the customer's browser to Square's servers (PCI compliant)

---

## Testing

To test without real cards, change `.env`:
```
SQUARE_ENVIRONMENT=sandbox
```
And use the Application ID from your Square app's Sandbox tab.

Square test card: `4111 1111 1111 1111`, any future date, any CVV, any ZIP.
