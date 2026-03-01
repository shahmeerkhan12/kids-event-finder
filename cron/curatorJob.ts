/**
 * Curator Cron Job — runs the Event Curator Agent on a schedule.
 * Execute with: npx ts-node cron/curatorJob.ts
 */
import cron   from 'node-cron'
import dotenv from 'dotenv'
import path   from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { runCurator } from '../lib/services/CuratorService'
import { logger }     from '../lib/logger'

const SCHEDULE = process.env.CURATOR_CRON_SCHEDULE ?? '0 */6 * * *'
const CITIES   = (process.env.CURATOR_TARGET_CITIES ?? 'London,Manchester,Birmingham')
  .split(',')
  .map(c => c.trim())
  .filter(Boolean)

logger.info({ schedule: SCHEDULE, cities: CITIES }, '[CuratorJob] Starting cron scheduler')

cron.schedule(SCHEDULE, async () => {
  logger.info('[CuratorJob] Cron triggered — running curator pipeline')
  for (const city of CITIES) {
    try {
      const count = await runCurator(city)
      logger.info({ city, count }, '[CuratorJob] City processed')
    } catch (err) {
      logger.error({ err, city }, '[CuratorJob] Failed to curate city')
    }
  }
  logger.info('[CuratorJob] All cities processed')
})

// Run immediately on startup
;(async () => {
  logger.info('[CuratorJob] Running initial seed on startup')
  for (const city of CITIES) {
    try {
      const count = await runCurator(city)
      logger.info({ city, count }, '[CuratorJob] Initial seed complete')
    } catch (err) {
      logger.error({ err, city }, '[CuratorJob] Initial seed failed')
    }
  }
})()
