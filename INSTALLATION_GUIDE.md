# SaLUT Equipment Management - Installation Guide

**Live prototype:** https://salut-equipment-system.onrender.com  
**Repository:** https://github.com/Prabath98/salut-equipment-system

This guide covers local setup and the existing Render deployment. The app is a pilot/demo, not a security-certified production system.

## Technology

- Python + Flask for application routes and equipment status rules.
- HTML, CSS and JavaScript for the responsive user interface, search, filters and QR scanning.
- Google Sheets through `gspread` and the Google Sheets API for shared storage.
- Render + Gunicorn for hosting.
- `openpyxl` for Excel exports, ReportLab for PDF exports, and `qrcode[pil]` for equipment QR labels.
- `html5-qrcode` is loaded from a CDN for browser camera scanning.

## Prerequisites

- Python 3.11 or another compatible Python 3 version.
- Access to this repository.
- A Google Cloud project with the Google Sheets API enabled.
- A Google service account and a Google spreadsheet shared with its service-account email as **Editor**.

## 1. Get the code

Download the repository ZIP from GitHub and extract it, or clone it:

```bash
git clone https://github.com/Prabath98/salut-equipment-system.git
cd salut-equipment-system
```

## 2. Configure Google Sheets

The app uses the workbook configured by `GOOGLE_SHEET_ID`. The existing hosted deployment uses:

```text
12WJ241c-d2Jm_4B-BYPaeNN8K8num5dlVCQWANezsi8
```

In Google Cloud Console:

1. Enable the Google Sheets API.
2. Create or select a service account and download its JSON key.
3. Share the target spreadsheet with the service-account email as Editor.
4. Store the JSON key in a private folder. Never commit it to GitHub or include it in a shared ZIP.

Expected worksheet names and headers:

- **Inventory:** `Equipment ID, Item Name, Category, Current Status, Current Location, Added At, Added By`
- **Transactions:** `Transaction ID, Timestamp, Action, Equipment ID, Item Name, Category, Person, Location, Project Number/Name, Requester/Project Manager, Project Location, Unit/Apartment Number, Notes, User`
- **Categories:** `Category`

Keep a backup before editing existing headers or equipment IDs.

## 3. Run locally on Windows PowerShell

Open a terminal in the project folder:

```powershell
python --version
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create a private `secrets` folder and save the service-account JSON there. Then set environment variables in that same PowerShell window. Adjust the JSON path if needed:

```powershell
$env:GOOGLE_SHEET_ID = "12WJ241c-d2Jm_4B-BYPaeNN8K8num5dlVCQWANezsi8"
$env:GOOGLE_APPLICATION_CREDENTIALS = "$PWD\secrets\salut-service-account.json"
$env:SECRET_KEY = python -c "import secrets; print(secrets.token_hex(32))"
$env:COOKIE_SECURE = "false"
python app.py
```

`COOKIE_SECURE=false` is only for local HTTP testing. Do not use it for the hosted HTTPS site. Open **http://127.0.0.1:5000**. Keep the terminal running; press **Ctrl+C** to stop the app.

## 4. Render deployment

The repository includes `render.yaml` with these settings:

- Build: `pip install -r requirements.txt`
- Start: `gunicorn -w 1 -b 0.0.0.0:$PORT app:app`
- Health check: `/health`

For the hosted service, check Render → **Environment**:

- `GOOGLE_SHEET_ID` is set to the intended workbook ID.
- `GOOGLE_SERVICE_ACCOUNT_JSON` contains the complete service-account JSON as a secret environment value.
- `SECRET_KEY` is a strong generated secret.
- `COOKIE_SECURE=true`.

After saving environment changes or committing code, check the Render deployment and logs. The live site is https://salut-equipment-system.onrender.com.

## 5. Initial verification

1. Open `/health`; the response should report `{"status":"ok"}`.
2. Open the home page and confirm the employee actions are visible.
3. Add a clearly marked test item, e.g. `DEMO Fan 01`. Its Equipment ID should match its name and status should start at `IN`.
4. Open the QR label and test print/download. On a movement page, allow camera permission and use the HTTPS site to scan a label.
5. Sign the item out. Confirm status becomes `OUT` and location is recorded.
6. Sign it in again. Confirm status becomes `IN`, assigned location is cleared, and the two movements appear in transaction history.
7. Search/filter inventory and history and check PDF/Excel exports contain only the matching rows.
8. In a separate test spreadsheet, test one transaction containing at least 15 items.

## Common issues

- **429 quota exceeded:** Stop repeated refreshes, wait briefly, retry once and inspect Render logs. Avoid unnecessary repeated Google Sheets reads.
- **Unexpected headers:** Compare the first row of each tab with the exact headers listed above. Do not rename tabs casually.
- **Google Sheets permission errors:** Check API enablement, spreadsheet ID, service-account email sharing and environment variables.
- **QR camera will not start:** Use HTTPS, allow camera permission, and make sure the browser can access the scanner CDN.
- **Scanned item is not eligible:** Sign Out only shows `IN` items; Sign In only shows `OUT` items.

## Security and operating limitations

- Employee flows do not require login, as required by the assessment. **The current source also does not enforce manager authentication on dashboard, inventory, history or category pages.** A separate URL does not restrict access. Use test data only until access control is added or an approved access risk is explicitly accepted.
- The name entered in a movement form is not independently verified.
- Keep `GOOGLE_SERVICE_ACCOUNT_JSON` and `SECRET_KEY` out of source control. Restrict spreadsheet sharing and back it up regularly.
- Google Sheets is convenient for a low-cost pilot, but the current locking approach does not provide strict atomic transactions for concurrent users.
- Costs may be zero incremental while existing Google Sheets and Render allowances cover usage; free-plan limits, uptime and API quotas can change.
- The built-in dashboard reads status totals and recent transactions from Google Sheets. A future external dashboard should use an authenticated, read-only API or approved read-only connection with rate limits and minimal exposed fields.
