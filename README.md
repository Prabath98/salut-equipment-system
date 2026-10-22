# SaLUT Equipment Management — pilot build

Live prototype: https://salut-equipment-system.onrender.com

This Flask application uses Google Sheets as its shared data store. It is intended as a pilot/demo for SaLUT's equipment sign-in/sign-out workflow, not a security-certified production system.

## Approach and technology
- **Web application:** Python, Flask and Jinja templates implement the routes, validation and status-transition rules.
- **User interface:** HTML, CSS and JavaScript provide responsive pages, search/category filters, multi-item selection and QR camera scanning.
- **Shared data:** Google Sheets, accessed through the Sheets API using `gspread` and a service account. The workbook has `Inventory`, `Transactions` and `Categories` tabs.
- **Hosting:** Render runs the Flask app through Gunicorn.
- **Reporting:** `openpyxl` generates Excel files and ReportLab generates PDF files. Export routes accept the current search/category parameters.
- **QR codes:** Python `qrcode[pil]` generates QR PNGs on demand. The browser scanner uses `html5-qrcode` from a CDN.

## Features in the current source
- Employee landing page with Sign Out, Sign In and Add Inventory.
- Inventory add/edit; Equipment ID equals the unique equipment name for new and edited records.
- Sign Out lists items currently `IN`; Sign In lists items currently `OUT`.
- Sign Out changes status to `OUT` and records the current location; Sign In changes status to `IN` and clears the assigned current location.
- Transactions record timestamp, action, equipment, person, location and related project/requester information.
- Dashboard totals for total, `IN`, `OUT` and categories, plus recent transactions.
- Inventory/history search and filters; PDF/Excel export routes; print/download QR labels and camera scan-to-select.

## Access and security status — important
- Employee routes intentionally do not require staff login, matching the assessment requirement.
- **Management routes are currently not protected by manager authentication in this source.** `/manager` redirects to `/manager/dashboard`; inventory, history and category routes are also accessible without a manager login. A separate URL is not access control.
- Use test/demo data only until proper manager authorization or an approved company identity/access layer is implemented.
- The app uses CSRF form-token checks and configures HTTP-only/SameSite session cookies, but these do not replace authentication and authorization.
- The person name is entered on the form and is not independently verified. Concurrent writes are not fully atomic with Google Sheets and an in-process lock.
- A Google Sheets read-quota (429) error occurred during setup/testing. Avoid repeated refreshes and monitor Render logs.

## Google Sheets configuration
The current spreadsheet ID is configured in Render as `GOOGLE_SHEET_ID`. The spreadsheet should remain private and be shared with the service-account email as Editor. Keep the complete service-account JSON and `SECRET_KEY` only in Render environment variables; never commit credentials to GitHub.

Expected environment variables:
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `SECRET_KEY`
- `COOKIE_SECURE=true`

## Routes
- Live employee landing page: `/`
- Sign Out: `/movement/out`
- Sign In: `/movement/in`
- Manage Inventory: `/inventory`
- Dashboard: `/manager/dashboard`
- Transaction history: `/transactions`
- Category management: `/categories`

## Equipment ID rule and existing data
The Equipment ID is intended to be the exact item name, e.g. `Air Scrubber 01` is its ID. Names must be unique. New equipment and edited names use this rule. The Manage Inventory UI does **not** include a bulk migration action for older IDs. Before changing legacy IDs, back up the spreadsheet and carefully validate the matching transaction references; print new QR labels after an ID change.

## Ongoing costs and dashboard integration
The design avoids introducing a separate paid database and may have zero incremental cost while existing Google Sheets access and Render/GitHub plans stay within included limits. This is not a cost guarantee: verify current plan limits, API quotas, uptime needs and any domain billing.

The built-in dashboard calculates total, available (`IN`) and signed-out (`OUT`) counts from the shared spreadsheet. A future external dashboard could use a carefully scoped read-only JSON API or permissioned Sheets connection. A production API should include authentication, rate limiting, data validation and only expose fields the dashboard needs.

## Before wider use
- Test the full sign-out → status/location update → sign-in → history sequence.
- Test QR scan on both movement screens.
- Test filtered PDF/Excel output against the visible filtered rows.
- Test one transaction with more than 14 items; verify every item's status and history row.
- Test with realistic inventory volume and inspect quota errors.
- Add management authorization, strengthen multi-user consistency, document backup/restore and complete end-to-end tests.


## Google Sheets read-quota protection
- The app reuses the authorized spreadsheet/workbook and worksheet objects rather than reopening them on every page load.
- Inventory, transaction history and categories are cached in each application worker for 20 seconds by default. Successful inventory edits, category additions and equipment movements invalidate the cache immediately.
- Optional Render setting: `SHEETS_CACHE_TTL_SECONDS` accepts 5–60 seconds. Increase it (for example, to `30` or `45`) if many users repeatedly open pages and slightly delayed visibility of out-of-band spreadsheet edits is acceptable.
- The first request after a fresh deployment must validate the sheet structure and load data, so it will still use several API requests. Avoid repeatedly refreshing during startup, and inspect Render logs if a 429 still occurs.
