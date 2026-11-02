import os

# Automatically bind to the port assigned by Render ($PORT) or default to 10000
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# Concurrency and worker settings
workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
threads = 2
worker_class = "sync"
timeout = 120
keepalive = 5

accesslog = "-"
errorlog = "-"
loglevel = "info"

