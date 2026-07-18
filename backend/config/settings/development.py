"""
Development environment settings.
"""

import os

from .base import *  # noqa: F403

DEBUG = True

# Avoid database dependency for stateless endpoints during initialization.
SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies"

