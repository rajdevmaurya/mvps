#!/usr/bin/env bash

# Simple launcher for all backend services in this repo.
# Usage (from project root):
#   bash start-backend.sh
#
# It assumes JARs are already built:
#   - service-registry/target/service-registry-0.0.1-SNAPSHOT.jar
#   - authorization-server/target/authorization-server-0.0.1.jar
#   - core-service/target/core-service-0.0.1-SNAPSHOT.jar
#   - api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar
# If not, run from project root first:
#   mvn clean install -DskipTests

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

start_service() {
  local name="$1"
  local jar_path="$2"
  local extra_args="${3:-}"

  echo "Starting ${name}..."
  if [[ ! -f "${jar_path}" ]]; then
    echo "  ERROR: JAR not found: ${jar_path}" >&2
    exit 1
  fi

  # Run each service in the background and redirect output to logs
  mkdir -p "${ROOT_DIR}/logs" "${ROOT_DIR}/pids"
  nohup java -jar "${jar_path}" ${extra_args} \
    > "${ROOT_DIR}/logs/${name}.log" 2>&1 &

  local pid=$!
  echo "${pid}" > "${ROOT_DIR}/pids/${name}.pid"
  echo "  -> ${name} started (PID ${pid}) – logs: logs/${name}.log"
}

cd "${ROOT_DIR}"

echo "Launching backend services from ${ROOT_DIR}" 

# 1. Service Registry (Eureka)
start_service "service-registry" \
  "${ROOT_DIR}/service-registry/target/service-registry-0.0.1-SNAPSHOT.jar"

# 2. Authorization Server
start_service "authorization-server" \
  "${ROOT_DIR}/authorization-server/target/authorization-server-0.0.1.jar"

# 3. API Gateway
start_service "api-gateway" \
  "${ROOT_DIR}/api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar"

# 4. Core Service
start_service "core-service" \
  "${ROOT_DIR}/core-service/target/core-service-0.0.1-SNAPSHOT.jar"

echo
echo "All backend services have been started in the background."
echo "Check the logs directory for output:"
echo "  logs/service-registry.log"
echo "  logs/authorization-server.log"
echo "  logs/core-service.log"
echo "  logs/api-gateway.log"