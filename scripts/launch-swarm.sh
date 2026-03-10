#!/bin/bash
# SCRAPE DOMINATION — Swarm Launch Script
# 10 agents, partitioned by department, Google-only, 120 total threads
cd "$(dirname "$0")/.."

WORKERS=12

echo "=== SCRAPE DOMINATION SWARM ==="
echo "  10 agents x $WORKERS workers = $((10 * WORKERS)) threads"
echo "  Source: Google only (PJ/societe disabled)"
echo "  Partitionnement: dept-based, ~81K/agent, zero overlap"
echo ""

npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 1  --depts 75,60,972,25,2B,02,10,32          --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-1.log  2>&1 &
npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 2  --depts 13,67,35,66,24,28,86,79,58,15     --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-2.log  2>&1 &
npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 3  --depts 93,92,64,73,22,81,16,12,53,55     --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-3.log  2>&1 &
npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 4  --depts 69,94,974,29,54,51,89,61,39,46    --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-4.log  2>&1 &
npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 5  --depts 83,44,76,63,45,21,88,41,08,976,00 --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-5.log  2>&1 &
npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 6  --depts 33,78,84,17,27,11,80,82,03,36,23  --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-6.log  2>&1 &
npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 7  --depts 59,31,62,68,26,2A,07,87,70,18     --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-7.log  2>&1 &
npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 8  --depts 34,95,57,56,85,37,973,65,43,05    --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-8.log  2>&1 &
npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 9  --depts 77,06,30,42,49,40,47,50,01,09,48  --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-9.log  2>&1 &
npx tsx scripts/scrape-domination.ts --workers $WORKERS --resume --agent-id 10 --depts 38,91,74,971,14,71,72,19,04,90,52 --skip-pj --skip-societe > scripts/.domination-data/swarm-agent-10.log 2>&1 &

echo "  All 10 agents launched."
echo "  Monitor: tail -f scripts/.domination-data/swarm-agent-1.log"
echo "  Kill all: pkill -f scrape-domination"
