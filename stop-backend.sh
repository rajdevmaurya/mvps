#!/usr/bin/env bash

# Stop all backend services started by start-backend.sh
# Usage (from project root):
#   bash stop-backend.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVICES=(
  "service-registry"
  "authorization-server"
  "api-gateway"
  "core-service"
)

stop_by_service() {
  local name="$1"
  local pid_file="${ROOT_DIR}/pids/${name}.pid"

  echo "Stopping ${name}..."

  if [[ ! -f "${pid_file}" ]]; then
    echo "  No PID file found at ${pid_file} (service may not be running)"
    return
  fi

  local pid
  pid="$(cat "${pid_file}")"

  if [[ -z "${pid}" ]]; then
    echo "  PID file is empty; nothing to stop"
    return
  fi

  if kill -0 "${pid}" 2>/dev/null; then
    kill "${pid}" || true
    echo "  Sent SIGTERM to PID ${pid}"
  else
    echo "  Process ${pid} not running; cleaning up PID file"
  fi

  rm -f "${pid_file}"
}

for name in "${SERVICES[@]}"; do
  stop_by_service "${name}"
  echo
done

echo "Stop command issued for all backend services (if they were running)."