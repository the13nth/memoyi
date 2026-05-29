# Minimal settings for running makemigrations for memoyi
from plane.settings.common import *

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Don't connect to Redis
REDIS_URL = "redis://localhost:6379/0"

# Disable scout APM
SCOUT_MONITOR = False

INSTALLED_APPS = [
    app for app in INSTALLED_APPS
    if not app.startswith("scout_apm")
]
