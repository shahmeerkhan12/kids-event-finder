/**
 * Structured JSON logger for the Kids Event Finder.
 * Writes logs to /logs/app.log and stdout.
 */
import fs   from 'fs'
import path from 'path'

const LOG_DIR  = path.resolve('./logs')
const LOG_FILE = path.join(LOG_DIR, 'app.log')

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function write(level: LogLevel, meta: Record<string, unknown>, message: string): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  })

  // Stdout
  console[level === 'debug' ? 'log' : level](entry)

  // Append to log file
  try {
    fs.appendFileSync(LOG_FILE, entry + '\n')
  } catch {
    // If log write fails, we don't want to crash the app
  }
}

export const logger = {
  info:  (meta: Record<string, unknown> | string, message?: string) => {
    if (typeof meta === 'string') write('info',  {}, meta)
    else write('info', meta, message ?? '')
  },
  warn:  (meta: Record<string, unknown> | string, message?: string) => {
    if (typeof meta === 'string') write('warn',  {}, meta)
    else write('warn', meta, message ?? '')
  },
  error: (meta: Record<string, unknown> | string, message?: string) => {
    if (typeof meta === 'string') write('error', {}, meta)
    else write('error', meta, message ?? '')
  },
  debug: (meta: Record<string, unknown> | string, message?: string) => {
    if (typeof meta === 'string') write('debug', {}, meta)
    else write('debug', meta, message ?? '')
  }
}
