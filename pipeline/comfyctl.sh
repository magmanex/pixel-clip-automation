#!/usr/bin/env bash
# ComfyUI service control for jef (this Mac mini).
#   comfyctl.sh {start|stop|restart|status|log [N]}
# Idempotent: start is a no-op if already up; stop is a no-op if already down.
set -uo pipefail
DIR="$HOME/sdev/private/comfyui"
PORT=8188
PY="$DIR/.venv/bin/python"
LOG="$DIR/comfy.log"
PAT="main.py --listen"

up() { curl -s -m 2 -o /dev/null "http://127.0.0.1:$PORT/"; }   # exit 0 = server answering

case "${1:-status}" in
  start)
    if up; then echo "already up on :$PORT (pid $(pgrep -f "$PAT" | head -1))"; exit 0; fi
    cd "$DIR" || { echo "missing $DIR"; exit 1; }
    nohup "$PY" main.py --listen 0.0.0.0 --port "$PORT" > "$LOG" 2>&1 &
    printf "starting pid %s" "$!"
    for i in $(seq 1 90); do up && { echo " — up after ${i}s on :$PORT"; exit 0; }; sleep 1; done
    echo " — TIMEOUT after 90s, check: comfyctl.sh log"; exit 1
    ;;
  stop)
    if pkill -f "$PAT"; then echo "stopped"; else echo "not running"; fi
    ;;
  restart)
    "$0" stop; sleep 3; "$0" start
    ;;
  status)
    if up; then echo "UP   :$PORT  (pid $(pgrep -f "$PAT" | head -1))"; else echo "DOWN :$PORT"; fi
    ;;
  log)
    tail -n "${2:-40}" "$LOG"
    ;;
  *)
    echo "usage: comfyctl.sh {start|stop|restart|status|log [N]}"; exit 1
    ;;
esac
