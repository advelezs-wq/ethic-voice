#!/usr/bin/env bash
# Deploys the BullMQ workers (workers/index.ts) to the production worker
# container `ethicvoice-ai-worker` on the verdata server.
#
# Usage: scripts/deploy-worker.sh [commit]   (default: HEAD)
#
# Ships only what the server's Dockerfile copies, from a committed tree (so
# uncommitted local changes never reach production). The server's .env is
# left untouched. The running container is only replaced if the new image
# builds; the previous image is kept as ethicvoice-ai-worker:prev-<stamp>.
set -euo pipefail

COMMIT="$(git rev-parse --short "${1:-HEAD}")"
STAMP="$(date +%Y%m%d-%H%M%S)"
SSH=(ssh -o BatchMode=yes -p 22222 verdata@186.115.101.10)
REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "→ Backing up the current worker folder"
"${SSH[@]}" "cp -a ~/ethicvoice-ai-worker ~/backups/ethicvoice-ai-worker-$STAMP"

echo "→ Uploading commit $COMMIT"
git -C "$REPO_ROOT" archive "$COMMIT" package.json bun.lock tsconfig.json prisma src workers \
  | "${SSH[@]}" "set -e; cd ~/ethicvoice-ai-worker; rm -rf src workers prisma; tar xf -; echo $COMMIT > DEPLOYED_COMMIT"

echo "→ Building the image and replacing the container"
"${SSH[@]}" "set -e
cd ~/ethicvoice-ai-worker
docker tag ethicvoice-ai-worker:latest ethicvoice-ai-worker:prev-$STAMP
docker build -t ethicvoice-ai-worker:latest .
docker stop ethicvoice-ai-worker && docker rm ethicvoice-ai-worker
docker run -d --name ethicvoice-ai-worker --restart unless-stopped --env-file .env ethicvoice-ai-worker:latest
sleep 20
docker ps --filter name=ethicvoice-ai-worker --format '{{.Names}} {{.Status}}'
docker logs --tail 25 ethicvoice-ai-worker"

echo "✓ Deployed $COMMIT. To roll back:"
echo "  ssh -p 22222 verdata@186.115.101.10 'docker stop ethicvoice-ai-worker && docker rm ethicvoice-ai-worker && docker run -d --name ethicvoice-ai-worker --restart unless-stopped --env-file ~/ethicvoice-ai-worker/.env ethicvoice-ai-worker:prev-$STAMP'"
