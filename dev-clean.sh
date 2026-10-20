#!/bin/bash
# Monthly developer disk cleanup. Safe: only deletes regenerable artifacts.
# Usage: ~/dev-clean.sh   (Docker Desktop must be RUNNING for Docker steps to work)

echo "Before: $(df -h /System/Volumes/Data | awk 'NR==2{print $4}') free"

if docker info > /dev/null 2>&1; then
  docker builder prune -af                            # build cache (your #1 killer)
  docker image prune -af                              # unused images
else
  echo "⚠ Docker daemon not running — skipping Docker cleanup (start Docker Desktop to reclaim build cache)"
fi

xcrun simctl delete unavailable                       # dead simulators
rm -rf ~/Library/Developer/Xcode/DerivedData/*        # Xcode build junk
rm -rf ~/Library/Developer/Xcode/Archives/*           # old app archives
npm cache clean --force 2>/dev/null                   # npm cache
rm -rf ~/Library/Caches/com.microsoft.VSCode.ShipIt   # stale VSCode updater (1.1GB!)

echo "After:  $(df -h /System/Volumes/Data | awk 'NR==2{print $4}') free"

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "👉 NEXT, run node_modules cleanup MANUALLY (don't automate this —"
echo "   you don't want a script nuking deps of the repo you're mid-feature on):"
echo ""
echo "       npx npkill"
echo ""
echo "   Delete node_modules in every repo EXCEPT the 1-2 you're"
echo "   actively working on. They come back with 'npm i'."
echo "─────────────────────────────────────────────────────────────"
