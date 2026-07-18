"""
Development environment settings.
"""

import os

from .base import *  # noqa: F403

DEBUG = True

# Avoid database dependency for stateless endpoints during initialization.
SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies"

USE_POSTGRES = os.getenv("USE_POSTGRES", "False").lower() in ("true", "1", "yes")

if not USE_POSTGRES:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
