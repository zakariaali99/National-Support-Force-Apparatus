"""Backup encryption. PLAN.md calls for "encrypted (age/gpg, key from env)"
— this project uses Fernet (AES-128-CBC + HMAC, via the `cryptography`
package) instead of shelling out to the `age`/`gpg` binaries, because
neither is guaranteed present on a bare VPS (this project's deploy target,
see PLAN.md's "no Docker" decision) without an extra system package
install, while `cryptography` ships as a normal Python wheel. Same
guarantee (backups unreadable without the key, key never touches the DB
disk), simpler ops story.
"""

import base64
import hashlib

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


def _fernet():
    from cryptography.fernet import Fernet

    key = getattr(settings, "BACKUP_ENCRYPTION_KEY", None)
    if not key:
        raise ImproperlyConfigured(
            "BACKUP_ENCRYPTION_KEY is not set — required to encrypt/decrypt backups."
        )
    # Fernet requires a 32-byte urlsafe-base64 key; derive one from
    # whatever string an operator puts in the env var rather than making
    # them generate/paste a Fernet key exactly, which is an easy way to
    # lock yourself out of your own backups with a typo.
    derived = hashlib.sha256(key.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(derived))


def encrypt_bytes(data: bytes) -> bytes:
    return _fernet().encrypt(data)


def decrypt_bytes(data: bytes) -> bytes:
    return _fernet().decrypt(data)
