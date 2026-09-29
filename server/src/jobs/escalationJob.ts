/**
 * The first scheduled job in the app. Plain setInterval — no queue system.
 * See modules/escalations/escalation.service.ts for the actual work; this
 * file is just the timer wrapper around it.
 */
import { env } from '../config/env'
import { logger } from '../config/logger'
import { runEscalationCheck } from '../modules/escalations/escalation.service'

let timer: ReturnType<typeof setInterval> | null = null

export function startEscalationJob(): void {
  const intervalMs = env.ESCALATION_JOB_INTERVAL_MINUTES * 60_000

  timer = setInterval(() => {
    runEscalationCheck()
      .then((result) => {
        if (result.rulesFired > 0) {
          logger.info(result, 'Escalation job fired rules')
        }
      })
      .catch((err) => logger.error({ err }, 'Escalation job run failed'))
  }, intervalMs)

  // Don't let this timer keep the process alive on its own.
  timer.unref()

  logger.info(`Escalation job scheduled every ${env.ESCALATION_JOB_INTERVAL_MINUTES} minutes`)
}

export function stopEscalationJob(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
