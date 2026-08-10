# NetSuite Suitelet Deployment Guide (Option A)

This guide provides step-by-step instructions to deploy the **Skyspan Architectural Skylight & Glass Floor Calculator** natively inside NetSuite as a **Suitelet** app, complete with a **`📄 Launch Skylight Calculator`** button on NetSuite Quote & Opportunity forms.

---

## 1. Upload Files to NetSuite File Cabinet

1. Log into NetSuite as an **Administrator**.
2. Go to **Documents > Files > File Cabinet**.
3. Open the **`SuiteScripts`** folder (or create a subfolder named `SuiteScripts/Skyspan/`).
4. Upload the following 3 files:
   - `index.html` (the full main calculator application)
   - `Skyspan_Calculator_Suitelet.js`
   - `Skyspan_Calculator_UserEvent.js`

---

## 2. Create & Deploy the Suitelet Script

1. Go to **Customization > Scripting > Scripts > New**.
2. Select **`Skyspan_Calculator_Suitelet.js`** from the dropdown and click **Create Script Record**.
3. Fill in the fields:
   - **Name**: `Skyspan Calculator Suitelet`
   - **ID**: `_skyspan_calc_suitelet` (NetSuite prefixes this to `customscript_skyspan_calc_suitelet`)
4. Click **Save & Deploy**.
5. On the **Script Deployment** page:
   - **Title**: `Skyspan Calculator Suitelet Deployment`
   - **ID**: `_skyspan_calc_suitelet` (NetSuite prefixes this to `customdeploy_skyspan_calc_suitelet`)
   - **Status**: Set to **`Released`**
   - **Log Level**: `Debug`
   - **Audience**: Select **`All Roles`** (or specific Estimating & Sales roles).
6. Click **Save**. Copy the **URL** of the deployed Suitelet for testing.

---

## 3. Create & Deploy the User Event Script (Adds Button to Quotes/Opportunities)

1. Go to **Customization > Scripting > Scripts > New**.
2. Select **`Skyspan_Calculator_UserEvent.js`** and click **Create Script Record**.
3. Fill in:
   - **Name**: `Skyspan Calculator User Event`
   - **ID**: `_skyspan_calc_userevent`
4. Click **Save & Deploy**.
5. On the **Script Deployment** page:
   - **Applies To**: Select **`Estimate`** (Quote).
   - **Status**: Set to **`Released`**.
   - **Audience**: Select **`All Roles`**.
6. Click **Save**.
7. *(Optional)* Repeat deployment step to also apply to **`Opportunity`** or **`Sales Order`** records.

---

## 4. Master Pricing Recommendation: NetSuite vs. Google Sheets

### Recommended Setup:
- **Primary Source (NetSuite File Cabinet / Custom Record)**: 
  Keep `Skyspan_Master_Pricing.xlsx` or `DEFAULTS` inside the NetSuite File Cabinet as the master authority. This prevents broken formulas and ensures zero dependency on external Google API latency.
- **Secondary / Live Sync**: 
  The calculator retains its live Google Sheet sync button (`Live Google Sheet`) so management can push quick real-time rate updates at any time!

---

## 5. Verifying the Deployment

1. Open any **Estimate (Quote)** or **Opportunity** record in NetSuite.
2. In the top action header, click the new **`📄 Launch Skylight Calculator`** button.
3. The native calculator pop-up will launch pre-filled with the NetSuite Quote Reference, Customer Name, and Date!
