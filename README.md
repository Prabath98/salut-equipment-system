# SaLUT Equipment Management — free-hosting build

This is a Flask web application designed for a small internal team. Render hosts the web app on its free web-service plan; Google Sheets is the shared data store. The app does not store equipment data on the Render filesystem.

## Features
- Mobile-responsive landing page with Signing OUT, Signing IN and Adding Inventory.
- Login sessions with employee and manager roles; manager-only dashboard, transaction history and category management are enforced server-side.
- Google Sheets-backed Inventory, Transactions and Categories tabs.
- Unique equipment IDs, IN/OUT eligibility filtering, item search and category filter.
- Re-checks equipment status when saving a movement and records the movement in transaction history.
- CSRF form-token check, password hashes, secure/HTTP-only session cookies, and no public data endpoints other than health check.

## Important limitations
- This is a starter implementation, not a security-certified or high-availability system. Review it with SaLUT IT before using it for sensitive or mission-critical records.
- Render free services can sleep when idle and may take time to wake. Availability and quotas are subject to provider policy.
- The app is configured for one Gunicorn worker. Its in-process lock helps serialize requests handled by that one process, but Google Sheets is not a transactional database. If two users attempt the same movement simultaneously, a narrow race condition is still possible. For strict concurrency guarantees, migrate to a database with transactions.
- Back up the Google spreadsheet regularly. Limit spreadsheet access to authorised administrators and the service account.
- User accounts are configured through environment variables; there is no in-app user administration screen yet.
- Only adding categories is implemented; category deletion/renaming is deliberately omitted to avoid breaking historical data.

## 1. Create the Google Sheet
1. Sign in to a Google account and create a blank Google Spreadsheet named `SaLUT Equipment Data`.
2. Copy the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.
3. Your spreadsheet ID is `12WJ241c-d2Jm_4B-BYPaeNN8K8num5dlVCQWANezsi8`. Configure this as the `GOOGLE_SHEET_ID` environment variable on Render; it is not hard-coded into the application. Leave the sheet tabs empty. On first app connection, the app creates `Inventory`, `Transactions`, and `Categories` with the required header rows and adds the three default categories.
4. Do not publish the spreadsheet to the web. Keep access restricted.

## 2. Create a Google service account
1. Open Google Cloud Console and create a project.
2. Enable the **Google Sheets API** for that project.
3. Create a service account and create a JSON key for it. Download the JSON key and keep it private.
4. Copy the service account email (ends in `iam.gserviceaccount.com`). Share the spreadsheet with that email as an **Editor**.
5. The JSON key is a secret. Never commit it to GitHub, paste it into source files, or send it in chat.

## 3. Prepare user password hashes
Use a local Python environment with the project requirements installed. Easiest: run `python generate_users.py` from this folder. It prompts for usernames, roles, and passwords, then prints the JSON with password hashes. Do not share the output publicly. Alternatively, generate an individual hash with:

```bash
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash(input('Password: ')))"
```

Create a JSON array for `USERS_JSON`, for example (replace all placeholders with actual usernames and generated hashes):

```json
[
  {"username":"employee1","role":"employee","password_hash":"scrypt:..."},
  {"username":"manager1","role":"manager","password_hash":"scrypt:..."}
]
```

Use strong, unique passwords. Do not use the example usernames as real credentials. Keep at least one manager account. Add further employees by adding entries to this array.

## 4. Publish to GitHub
1. Create a **private** GitHub repository, for example `salut-equipment-system`.
2. Upload the contents of this folder (not the ZIP file itself) to the repository root.
3. Ensure the Google service-account JSON key and actual user/password data are **not** committed. The `.gitignore` is provided as a reminder.

## 5. Deploy on Render Free
1. Sign in to Render and choose **New → Web Service**.
2. Connect the GitHub repository.
3. Set runtime to Python if asked. Build command: `pip install -r requirements.txt`. Start command: `gunicorn -w 1 -b 0.0.0.0:$PORT app:app`.
4. Select the **Free** instance type.
5. In the service's Environment settings, add:
   - `SECRET_KEY`: generate a long random secret (or use Render's generated secret if supported).
   - `COOKIE_SECURE`: `true`
   - `GOOGLE_SHEET_ID`: the spreadsheet ID from step 1.
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: the entire contents of the service account JSON key file as one JSON value.
   - `USERS_JSON`: the JSON array of users with password hashes.
6. Deploy and wait for the build to finish. Open the `onrender.com` URL. Test login, sign in/out, inventory creation, manager-only dashboard, history and category management.
7. Confirm that employee accounts cannot access `/dashboard`, `/transactions`, or `/categories` (they should receive a 403 page), and that logging out ends the session.

If Render's dashboard does not accept multi-line JSON as an environment variable, paste the complete JSON value into the value field; do not wrap the entire JSON in extra quotation marks. Never include the service account key in the repository.

## 6. Smoke test checklist
- [ ] Login works with employee and manager accounts.
- [ ] Invalid passwords are rejected.
- [ ] Employee cannot access manager-only routes.
- [ ] Adding an item generates a unique ID and sets initial status to IN.
- [ ] Signing OUT only lists items currently IN.
- [ ] Signing IN only lists items currently OUT.
- [ ] Repeated movement is rejected if status no longer matches.
- [ ] Each successful movement creates a Transactions row.
- [ ] Search and category filter work on desktop and mobile.
- [ ] Data remains after the web service sleeps and wakes.
- [ ] Spreadsheet is shared only with the service account and approved staff.

## Local development
```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
Set the same environment variables locally before running. The `/health` endpoint does not test Google Sheets credentials; verify data access by logging in and opening a data page.


## Security notes before staff use
- Use unique passwords of at least 12 characters and create at least one manager account.
- Never share `GOOGLE_SERVICE_ACCOUNT_JSON`, the downloaded service-account JSON file, or `USERS_JSON` in chat or commit them to GitHub.
- Restrict Google Sheet sharing to the service account and approved administrators.
- The current one-process lock reduces but does not eliminate simultaneous-update races. For a critical inventory workflow, migrate to a transactional database before relying on it for strict concurrent correctness.
- Free hosting has availability/sleep limits; treat it as a pilot rather than guaranteed business-critical hosting.
