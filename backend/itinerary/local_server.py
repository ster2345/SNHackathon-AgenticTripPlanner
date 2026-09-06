"""python -m backend.itinerary.local_server [--live]

Serves the integration screen and a memory-only demo on loopback. --live uses
Claude with the same demo members; it does NOT connect to production tables.
"""
import argparse
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from .bedrock import call_claude
from .demo import DemoStore, fixture_model
from .itinerary_lambda import dispatch
from .planner import Problem
from .service import ItineraryService


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if args.live:
        from dotenv import load_dotenv
        load_dotenv()
    store = DemoStore()
    service = ItineraryService(store, call_claude if args.live else fixture_model,
                               "bedrock" if args.live else "demo-fixture")
    root = (Path(__file__).resolve().parents[2] / "frontend" / "itinerary" / "dist").resolve()

    class Handler(BaseHTTPRequestHandler):
        def respond(self, status, value):
            data = json.dumps(value).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            path = urlsplit(self.path).path
            if path == "/" or path.startswith("/assets/"):
                asset = (root / ("index.html" if path == "/" else path.lstrip("/"))).resolve()
                if not asset.is_relative_to(root) or not asset.is_file():
                    self.respond(404, {"error": "React build not found. Run npm.cmd install and npm.cmd run build in frontend/itinerary."})
                    return
                self.send_response(200)
                self.send_header("Content-Type", (mimetypes.guess_type(asset.name)[0] or "application/octet-stream") + "; charset=utf-8")
                self.end_headers()
                self.wfile.write(asset.read_bytes())
            else:
                self.api()

        def api(self):
            try:
                path = urlsplit(self.path).path
                if self.headers.get("Origin") not in (None, f"http://127.0.0.1:{args.port}", f"http://localhost:{args.port}"):
                    raise Problem("Origin is not allowed.", 403)
                size = int(self.headers.get("Content-Length", 0))
                if not 0 <= size <= 20000:
                    raise Problem("Request too large.", 413)
                body = json.loads(self.rfile.read(size) or b"{}")
                if not isinstance(body, dict):
                    raise Problem("Request body must be an object.")
                uid = self.headers.get("X-Demo-User", "alex")
                if path == "/demo/membership" and self.command == "POST":
                    target = body.get("user_id")
                    if target == "alex" or target not in ("sam", "priya") or type(body.get("active")) is not bool:
                        raise Problem("Choose Sam or Priya and a boolean active status.")
                    for member in store.people:
                        if member["user_id"] == target:
                            member["status"] = "active" if body["active"] else "left"
                    result = {"status": "updated"}
                else:
                    result = dispatch(service, self.command, path, uid, body)
                self.respond(200, result)
            except Problem as exc:
                self.respond(exc.status, {"error": str(exc)})
            except (ValueError, UnicodeError):
                self.respond(400, {"error": "Invalid JSON request."})
            except Exception:
                self.respond(500, {"error": "Local request failed. Check your configuration."})
                raise

        do_POST = api
        do_PUT = api

    class LocalServer(HTTPServer):
        allow_reuse_address = False

    server = LocalServer(("127.0.0.1", args.port), Handler)
    print(f"Person B demo: http://127.0.0.1:{args.port} ({service.source}; memory resets on restart)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
