# Skyspan Calculator — Netlify Deployment

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | The complete calculator app (password-gated) |
| `prices.json` | Live pricing data — update this to update prices everywhere |
| `netlify.toml` | Netlify configuration |

---

## Deploying to Netlify (first time — 5 minutes)

### Step 1 — Create a free Netlify account
Go to [netlify.com](https://netlify.com) and sign up with your email.

### Step 2 — Deploy by drag and drop
1. Go to **[app.netlify.com](https://app.netlify.com)**
2. At the bottom of the page, find the **"Deploy manually"** section
3. Drag the entire **`netlify`** folder onto the drop zone
4. Netlify will give you a URL like `https://random-name-123.netlify.app`

### Step 3 — Set a custom site name (optional)
1. In Netlify, go to **Site configuration → General → Site details**
2. Click **Change site name** and set it to e.g. `skyspan-calc`
3. Your URL becomes `https://skyspan-calc.netlify.app`

### Step 4 — Share the URL and password with staff
- **URL:** `https://your-site-name.netlify.app`
- **Password:** `skyspan2025` (see "Changing the password" below)

---

## Updating prices

The calculator fetches `prices.json` from the same server on every page load.
To update pricing for everyone:

### Option A — Manual (simplest)
1. Update `Skyspan_Master_Pricing.xlsx` as usual
2. Run the extract script to regenerate `prices.json` (ask your developer)
3. Re-drag the `netlify` folder onto Netlify — it redeploys in seconds

### Option B — Power Automate (automated)
Set up a Power Automate flow that:
1. Triggers when `Skyspan_Master_Pricing.xlsx` is saved in SharePoint
2. Extracts pricing data to JSON
3. Calls the **Netlify Deploy Hook** to push a new `prices.json`

To create a deploy hook:
1. In Netlify → **Site configuration → Build & deploy → Build hooks**
2. Add a new hook, copy the webhook URL
3. POST your `prices.json` content to that URL from Power Automate

---

## Changing the password

The password is stored as Base64 in `index.html`. To change it:

1. Open a Node.js terminal and run:
   ```
   node -e "console.log(Buffer.from('your-new-password').toString('base64'))"
   ```
2. Open `index.html` and find the line:
   ```
   var PW_B64 = 'c2t5c3BhbjIwMjU=';
   ```
3. Replace the Base64 string with your new one
4. Redeploy to Netlify

**Default password:** `skyspan2025`

---

## Redeploying after changes

Any time you update `index.html` or `prices.json`:
1. Go to [app.netlify.com](https://app.netlify.com) → your site
2. Drag the `netlify` folder onto the deploy zone again
3. Done — deploys in under 30 seconds

---

## Custom domain (optional)

If you want it at e.g. `calc.skyspan.com.au`:
1. Netlify → **Domain management → Add custom domain**
2. Add your domain and follow the DNS instructions
3. Netlify provides free HTTPS automatically
