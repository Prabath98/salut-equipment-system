"""Generate USERS_JSON for the SaLUT app without saving plaintext passwords.
Run locally: python generate_users.py
Copy the final JSON output into Render's USERS_JSON environment variable.
"""
import json
from getpass import getpass
from werkzeug.security import generate_password_hash

users = []
print("Create SaLUT application accounts. Passwords are not displayed or saved as plaintext.")
while True:
    username = input("Username (blank to finish): ").strip()
    if not username:
        break
    if any(u["username"] == username for u in users):
        print("That username is already in this batch. Choose another.")
        continue
    role = input("Role (employee/manager): ").strip().lower()
    if role not in ("employee", "manager"):
        print("Role must be employee or manager.")
        continue
    password = getpass("Password (use a unique strong password): ")
    confirm = getpass("Confirm password: ")
    if len(password) < 12:
        print("Use at least 12 characters. Try again.")
        continue
    if password != confirm:
        print("Passwords did not match. Try again.")
        continue
    users.append({"username": username, "role": role, "password_hash": generate_password_hash(password)})
    print("Account added.\n")
if not users:
    raise SystemExit("No accounts created; no JSON generated.")
if not any(u["role"] == "manager" for u in users):
    raise SystemExit("At least one manager account is required. Run again and add a manager.")
print("\nCopy everything below into Render's USERS_JSON environment variable. Keep it private:\n")
print(json.dumps(users, separators=(",", ":")))
