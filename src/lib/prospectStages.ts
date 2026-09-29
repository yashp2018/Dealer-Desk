/**
 * Mirrors server/src/modules/prospects/prospect.service.ts's ALLOWED_TRANSITIONS.
 * Kept in sync manually — this is a fixed enterprise workflow (per that file's
 * own comment), not data that changes, so duplicating it here to drive button
 * state is a safe tradeoff against a network round-trip just to know which
 * buttons should be clickable.
 */
export const PROSPECT_STAGE_TRANSITIONS: Record<string, string[]> = {
  new: ['contacted', 'dropped'],
  contacted: ['qualified', 'dropped'],
  qualified: ['visit_planned', 'dropped'],
  visit_planned: ['visit_completed', 'dropped'],
  visit_completed: ['onboarding', 'dropped'],
  onboarding: ['approved', 'dropped'],
  approved: ['converted', 'dropped'],
  converted: [],
  dropped: [],
}

/**
 * Whether clicking a stage button for `target` from `current` would actually
 * succeed. `converted` is excluded even when the backend's state machine
 * allows it — that transition only happens through the dedicated Convert
 * flow (POST /prospects/:id/convert), never through setStage directly.
 */
export function canSetProspectStage(current: string, target: string): boolean {
  if (current === target) return true
  if (target === 'converted') return false
  return PROSPECT_STAGE_TRANSITIONS[current]?.includes(target) ?? false
}
