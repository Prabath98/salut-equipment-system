"""Generate a password hash for Render's MANAGER_PASSWORD_HASH variable."""
from getpass import getpass
from werkzeug.security import generate_password_hash

password = getpass('Create a strong manager password (input hidden): ')
confirm = getpass('Re-enter manager password: ')
if len(password) < 12:
    raise SystemExit('Use at least 12 characters.')
if password != confirm:
    raise SystemExit('Passwords do not match.')
print('\nCopy this hash into Render as MANAGER_PASSWORD_HASH. Do not share it publicly:\n')
print(generate_password_hash(password))
