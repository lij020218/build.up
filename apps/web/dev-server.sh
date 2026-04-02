#!/bin/bash
# dev 서버 자동 재시작 스크립트
# 서버가 죽으면 5초 후 자동으로 다시 시작합니다.
PORT=3000

while true; do
  echo "[$(date)] Starting dev server on port $PORT..."
  lsof -ti:$PORT | xargs kill -9 2>/dev/null
  sleep 1
  npx next dev -p $PORT
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE. Restarting in 5s..."
  sleep 5
done
