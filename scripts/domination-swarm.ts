/**
 * DOMINATION SWARM — Lance N instances paralleles sur des tranches de departements
 *
 * Chaque agent travaille sur un sous-ensemble de departements.
 * Anti-doublon garanti par la verification DB dans scrape-domination.ts
 *
 * Usage:
 *   npx tsx scripts/domination-swarm.ts [--agents N] [--workers-per-agent N] [--limit-per-agent N]
 *
 * Default: 5 agents x 4 workers = 20 requetes concurrentes
 */
import { execSync, spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

const DEPTS = [
  // Ordered by provider count (most populated first for maximum impact)
  '75','92','93','94','91','78','77','95', // IDF
  '13','69','59','33','31','06','34','44', // Grandes metros
  '38','67','76','83','30','57','62','35', // Metros moyennes
  '42','54','29','56','14','45','49','37', // Villes moyennes
  '17','64','68','86','21','63','51','74', // Tier 3
  '84','01','26','60','27','72','85','71', // Tier 4
  '25','73','22','50','11','40','66','80', // Tier 5
  '28','10','87','47','82','81','16','24', // Tier 6
  '88','79','53','89','41','02','07','58', // Tier 7
  '39','03','18','61','08','70','52','19', // Tier 8
  '65','36','55','43','12','32','46','05', // Tier 9
  '15','48','23','90','09','2A','2B',      // Petits depts
]

interface AgentState {
  pid: number
  depts: string[]
  proc: ChildProcess
  startTime: number
}

async function main() {
  const args = process.argv.slice(2)
  const numAgents = args.includes('--agents') ? parseInt(args[args.indexOf('--agents') + 1]) : 5
  const workersPerAgent = args.includes('--workers-per-agent') ? parseInt(args[args.indexOf('--workers-per-agent') + 1]) : 4
  const limitPerAgent = args.includes('--limit-per-agent') ? parseInt(args[args.indexOf('--limit-per-agent') + 1]) : 0

  // Split departments across agents
  const chunks: string[][] = Array.from({ length: numAgents }, () => [])
  for (let i = 0; i < DEPTS.length; i++) {
    chunks[i % numAgents].push(DEPTS[i])
  }

  console.log('\n' + '='.repeat(70))
  console.log('  DOMINATION SWARM — Multi-Agent Parallel Enrichment')
  console.log('='.repeat(70))
  console.log(`  Agents:          ${numAgents}`)
  console.log(`  Workers/agent:   ${workersPerAgent}`)
  console.log(`  Total concurrent: ${numAgents * workersPerAgent} requests`)
  console.log(`  Limit/agent:     ${limitPerAgent > 0 ? limitPerAgent : 'illimite'}`)
  console.log()

  for (let i = 0; i < numAgents; i++) {
    console.log(`  Agent ${i + 1}: ${chunks[i].length} depts [${chunks[i].slice(0, 5).join(',')}${chunks[i].length > 5 ? '...' : ''}]`)
  }
  console.log()

  const startTime = Date.now()
  const agents: AgentState[] = []
  const logDir = path.join(__dirname, '.domination-data')
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

  // Launch agents
  for (let i = 0; i < numAgents; i++) {
    const deptList = chunks[i].join(',')
    const logFile = path.join(logDir, `swarm-agent-${i + 1}.log`)

    // Each agent processes its dept list sequentially
    const scriptPath = path.join(__dirname, 'domination-agent.ts')
    const agentArgs = [
      scriptPath,
      '--depts', deptList,
      '--workers', String(workersPerAgent),
      '--agent-id', String(i + 1),
      '--resume',
    ]
    if (limitPerAgent > 0) agentArgs.push('--limit', String(limitPerAgent))

    const logStream = fs.createWriteStream(logFile)
    const proc = spawn('npx', ['tsx', ...agentArgs], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      shell: true,
    })

    proc.stdout?.pipe(logStream)
    proc.stderr?.pipe(logStream)

    // Also pipe key lines to console
    proc.stdout?.on('data', (data: Buffer) => {
      const line = data.toString().trim()
      // Only show summary lines (every 50th or phone found)
      if (line.includes('RESULTATS') || line.includes('====') ||
          (line.includes('|') && (line.includes('+') || line.match(/\[\d+0\]/)))) {
        console.log(`  [A${i + 1}] ${line}`)
      }
    })

    proc.on('exit', (code) => {
      const dur = Math.floor((Date.now() - startTime) / 1000 / 60)
      console.log(`  [A${i + 1}] Termine (code ${code}) apres ${dur}min`)
    })

    agents.push({ pid: proc.pid || 0, depts: chunks[i], proc, startTime: Date.now() })
    console.log(`  Agent ${i + 1} lance (PID ${proc.pid})`)
  }

  // Monitoring loop
  const monitorInterval = setInterval(() => {
    // Read progress from all agents
    let totalProcessed = 0, totalPhones = 0, totalCredits = 0, totalRatings = 0
    for (let i = 0; i < numAgents; i++) {
      const progFile = path.join(logDir, `progress-agent-${i + 1}.json`)
      if (fs.existsSync(progFile)) {
        try {
          const d = JSON.parse(fs.readFileSync(progFile, 'utf-8'))
          const s = d.stats || {}
          totalProcessed += s.processed || 0
          totalPhones += s.phonesFound || 0
          totalCredits += s.apiCredits || 0
          totalRatings += s.ratingsFound || 0
        } catch {}
      }
    }

    const mins = (Date.now() - startTime) / 60000
    const phoneRate = mins > 1 ? Math.round(totalPhones / mins) : 0
    const provRate = mins > 1 ? Math.round(totalProcessed / mins) : 0

    console.log(
      `\n  [SWARM ${Math.floor(mins)}min] ` +
      `${totalProcessed.toLocaleString()} traites | ` +
      `+${totalPhones.toLocaleString()} phones | ` +
      `+${totalRatings.toLocaleString()} ratings | ` +
      `${totalCredits.toLocaleString()} credits | ` +
      `${provRate}/min | ${phoneRate} phones/min\n`
    )
  }, 60000) // Every minute

  // Wait for all agents
  const promises = agents.map(a => new Promise<void>(resolve => {
    a.proc.on('exit', () => resolve())
  }))

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n  Arret de tous les agents...')
    clearInterval(monitorInterval)
    for (const a of agents) {
      try { a.proc.kill('SIGINT') } catch {}
    }
    setTimeout(() => process.exit(1), 5000)
  })

  await Promise.all(promises)
  clearInterval(monitorInterval)

  // Final tally
  let totalProcessed = 0, totalPhones = 0, totalCredits = 0, totalRatings = 0, totalWebsites = 0
  for (let i = 0; i < numAgents; i++) {
    const progFile = path.join(logDir, `progress-agent-${i + 1}.json`)
    if (fs.existsSync(progFile)) {
      try {
        const d = JSON.parse(fs.readFileSync(progFile, 'utf-8'))
        const s = d.stats || {}
        totalProcessed += s.processed || 0
        totalPhones += s.phonesFound || 0
        totalCredits += s.apiCredits || 0
        totalRatings += s.ratingsFound || 0
        totalWebsites += s.websitesFound || 0
      } catch {}
    }
  }

  const totalMins = Math.floor((Date.now() - startTime) / 60000)
  console.log('\n' + '='.repeat(70))
  console.log('  SWARM FINAL — DOMINATION COMPLETE')
  console.log('='.repeat(70))
  console.log(`  Duree:       ${totalMins}min`)
  console.log(`  Traites:     ${totalProcessed.toLocaleString()}`)
  console.log(`  Phones:      +${totalPhones.toLocaleString()}`)
  console.log(`  Ratings:     +${totalRatings.toLocaleString()}`)
  console.log(`  Websites:    +${totalWebsites.toLocaleString()}`)
  console.log(`  Credits:     ${totalCredits.toLocaleString()}`)
  if (totalPhones > 0) {
    console.log(`  Credits/ph:  ${Math.round(totalCredits / totalPhones)}`)
    console.log(`  Phones/min:  ${Math.round(totalPhones / Math.max(1, totalMins))}`)
  }
  console.log('='.repeat(70) + '\n')
}

main().catch(e => { console.error(e); process.exit(1) })
