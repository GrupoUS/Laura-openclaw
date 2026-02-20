#!/usr/bin/env python3
"""UDS Search CLI — quick search across all data sources.

Usage:
  python3 uds-search.py "termo de busca"
  python3 uds-search.py "termo" --type bm25 --top 5
  python3 uds-search.py --status
  python3 uds-search.py --sync notion
"""

import argparse
import json
import sys
import urllib.request
import urllib.error

UDS_BASE = "http://localhost:8000"


def search(query: str, search_type: str = "hybrid", top_k: int = 10) -> None:
    data = json.dumps({"query": query, "top_k": top_k, "search_type": search_type}).encode()
    req = urllib.request.Request(
        f"{UDS_BASE}/search",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
    except urllib.error.URLError as e:
        print(f"❌ UDS API error: {e}", file=sys.stderr)
        sys.exit(1)

    results = result.get("results", [])
    print(f"\n🔍 {len(results)} results for '{query}' ({search_type})\n")

    for i, r in enumerate(results, 1):
        source = "📁 Drive"
        path = r.get("file_path", "")
        if path.startswith("/notion"):
            source = "📝 Notion"
        elif path.startswith("/kiwify"):
            source = "🛒 Kiwify"

        content = r.get("content", "")[:200].replace("\n", " ")
        print(f"  {i}. {source} {r.get('file_name', '?')}")
        print(f"     Score: {r.get('rrf_score', 0):.4f} | {r.get('heading', '-')}")
        print(f"     {content}...")
        print()


def status() -> None:
    try:
        with urllib.request.urlopen(f"{UDS_BASE}/sync/status", timeout=10) as resp:
            data = json.loads(resp.read())
    except urllib.error.URLError as e:
        print(f"❌ UDS API error: {e}", file=sys.stderr)
        sys.exit(1)

    print("\n📊 UDS Index Status\n")
    for source, count in data.get("sources", {}).items():
        icon = {"drive": "📁", "notion": "📝", "kiwify": "🛒"}.get(source, "📄")
        print(f"  {icon} {source}: {count:,} files")
    print(f"\n  Total: {data.get('total_files', 0):,}")


def sync(source: str) -> None:
    req = urllib.request.Request(f"{UDS_BASE}/sync/{source}", method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read())
        print(f"✅ Sync {source}: {json.dumps(data, indent=2)}")
    except urllib.error.URLError as e:
        print(f"❌ Sync error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="UDS Search CLI")
    parser.add_argument("query", nargs="?", help="Search query")
    parser.add_argument("--type", default="hybrid", choices=["hybrid", "bm25", "vector"])
    parser.add_argument("--top", type=int, default=10, help="Number of results")
    parser.add_argument("--status", action="store_true", help="Show index status")
    parser.add_argument("--sync", choices=["notion", "kiwify", "drive"], help="Trigger sync")

    args = parser.parse_args()

    if args.status:
        status()
    elif args.sync:
        sync(args.sync)
    elif args.query:
        search(args.query, args.type, args.top)
    else:
        parser.print_help()
