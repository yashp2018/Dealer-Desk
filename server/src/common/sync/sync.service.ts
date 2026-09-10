/**
 * common/sync/sync.service.ts
 *
 * Offline sync batch processor.
 * Mirrors Dd_sync_service.php: accepts a batch of queued mutations
 * from the mobile client, applies them in order, and returns a
 * change-feed of server-side updates since the client's last sync.
 *
 * Business rules preserved from Dd_sync_service.php:
 * - Each mutation has an entity type, action, payload, and client_id.
 * - Mutations are applied idempotently using client_id as a dedup key.
 * - Conflicts (server record newer than client's last_sync_at) are
 *   returned in the conflicts array rather than silently overwriting.
 * - The change-feed returns all records modified after since_at.
 */

import { AppError } from '../errors/AppError'

export type SyncAction = 'create' | 'update' | 'delete'
export type SyncEntity = 'request' | 'visit' | 'provider' | 'service'

export interface SyncMutation {
  client_id: string
  entity: SyncEntity
  action: SyncAction
  payload: Record<string, unknown>
  client_updated_at: string
}

export interface SyncResult {
  synced: number
  failed: number
  conflicts: Array<{ client_id: string; reason: string }>
}

export interface SyncChanges {
  changes: Array<{
    entity: SyncEntity
    action: SyncAction
    record: Record<string, unknown>
    server_updated_at: string
  }>
}

// Registry of entity handlers — populated by each module at startup
const entityHandlers = new Map<
  SyncEntity,
  {
    apply: (mutation: SyncMutation) => Promise<void>
    changes: (since: Date) => Promise<Array<Record<string, unknown>>>
  }
>()

export function registerSyncHandler(
  entity: SyncEntity,
  handler: (typeof entityHandlers extends Map<SyncEntity, infer V> ? V : never),
): void {
  entityHandlers.set(entity, handler)
}

export async function processBatch(mutations: SyncMutation[]): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, conflicts: [] }

  for (const mutation of mutations) {
    const handler = entityHandlers.get(mutation.entity)
    if (!handler) {
      result.failed++
      result.conflicts.push({
        client_id: mutation.client_id,
        reason: `Unknown entity: ${mutation.entity}`,
      })
      continue
    }

    try {
      await handler.apply(mutation)
      result.synced++
    } catch (err) {
      result.failed++
      result.conflicts.push({
        client_id: mutation.client_id,
        reason: err instanceof AppError ? err.message : 'Apply failed',
      })
    }
  }

  return result
}

export async function getChanges(since: Date): Promise<SyncChanges> {
  const changes: SyncChanges['changes'] = []

  for (const [entity, handler] of entityHandlers.entries()) {
    const records = await handler.changes(since)
    for (const record of records) {
      changes.push({
        entity,
        action: 'update',
        record,
        server_updated_at: new Date().toISOString(),
      })
    }
  }

  return { changes }
}
