#!/usr/bin/env python3
"""
Standalone MongoDB Atlas Diagnostic & Connectivity Verification Script.
Can be run locally or via Render Shell to test connection before deploying.

Usage:
    python test_mongo.py
    python test_mongo.py "mongodb+srv://user:pass@cluster0.cq68ujv.mongodb.net/ai_social_media"
"""

import sys
import os
import re
import time
from dotenv import load_dotenv

# Load local environment variables if available
load_dotenv()

def mask_mongo_uri(uri: str) -> str:
    """Masks database password in connection string for safe terminal logging."""
    if not uri:
        return "<EMPTY>"
    return re.sub(r":([^@/]+)@", ":****@", uri)

def run_diagnostic():
    print("=" * 65)
    print("  MongoDB Atlas Connection Diagnostic & Pre-flight Check")
    print("=" * 65)

    # 1. Resolve URI
    uri = sys.argv[1] if len(sys.argv) > 1 else os.getenv("MONGO_URI")
    if not uri:
        print("\n❌ ERROR: No MONGO_URI provided.")
        print("Set MONGO_URI in your environment or pass it as an argument:")
        print('    python test_mongo.py "mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/dbname"')
        sys.exit(1)

    print(f"\n[1/4] Target URI: {mask_mongo_uri(uri)}")
    
    # 2. Check dependencies
    try:
        import certifi
        import dns.resolver
        from pymongo import MongoClient
        from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
        print(f"[2/4] Dependencies verified:")
        print(f"      - certifi CA bundle: {certifi.where()}")
        print(f"      - dnspython: OK (required for mongodb+srv://)")
    except ImportError as e:
        print(f"\n❌ Missing required dependency: {e}")
        print("Run: pip install certifi dnspython pymongo")
        sys.exit(1)

    # 3. Connection attempt
    print("\n[3/4] Initiating connection to MongoDB Atlas...")
    client_kwargs = {
        "serverSelectionTimeoutMS": 10000,
        "connectTimeoutMS": 10000,
        "socketTimeoutMS": 10000,
        "retryWrites": True
    }
    if uri.startswith("mongodb+srv://") or "mongodb.net" in uri or "tls=true" in uri.lower():
        client_kwargs["tls"] = True
        client_kwargs["tlsCAFile"] = certifi.where()

    start_time = time.time()
    try:
        client = MongoClient(uri, **client_kwargs)
        # Execute admin ping
        ping_result = client.admin.command("ping")
        elapsed = round((time.time() - start_time) * 1000, 2)
        print(f"      ✅ Ping successful in {elapsed}ms! Response: {ping_result}")

        # Fetch cluster build & topology info
        build_info = client.admin.command("buildInfo")
        version = build_info.get("version", "unknown")
        print(f"      Cluster MongoDB Version: {version}")

        # 4. Read/Write test
        print("\n[4/4] Verifying read & write permissions...")
        db_name = os.getenv("MONGO_DB_NAME", "ai_social_media")
        db = client[db_name]
        test_col = db["__diag_conn_test__"]
        
        # Insert
        insert_res = test_col.insert_one({"diagnostic": "atlas_check", "timestamp": time.time()})
        print(f"      ✅ Insert OK (doc id: {insert_res.inserted_id})")
        
        # Read
        doc = test_col.find_one({"_id": insert_res.inserted_id})
        assert doc is not None, "Failed to read inserted document"
        print(f"      ✅ Read OK")

        # Cleanup
        test_col.delete_one({"_id": insert_res.inserted_id})
        print(f"      ✅ Cleanup OK")

        print("\n" + "=" * 65)
        print("  🎉 ALL CHECKS PASSED: Atlas is reachable and fully functional!")
        print("=" * 65)
        sys.exit(0)

    except ServerSelectionTimeoutError as e:
        print("\n" + "!" * 65)
        print("❌ CONNECTION FAILED: ServerSelectionTimeoutError")
        print(f"Details: {e}")
        print("\n👉 MOST PROBABLE CAUSE:")
        print("   1. MongoDB Atlas Network Access IP allowlist does NOT include")
        print("      your client's IP. On Render, dynamic outbound IPs are used,")
        print("      so you MUST add 0.0.0.0/0 (Allow Access from Anywhere) in:")
        print("      Atlas Dashboard -> Security -> Network Access -> Add IP -> 0.0.0.0/0")
        print("   2. Atlas cluster may be paused (free tier M0 pauses after inactivity).")
        print("   3. Username or password in MONGO_URI contains unescaped special characters")
        print("      (such as @, :, %, #). Ensure password is URL-encoded.")
        print("!" * 65)
        sys.exit(1)
    except Exception as e:
        print("\n" + "!" * 65)
        print(f"❌ CONNECTION FAILED: {type(e).__name__}: {e}")
        print("!" * 65)
        sys.exit(1)

if __name__ == "__main__":
    run_diagnostic()

