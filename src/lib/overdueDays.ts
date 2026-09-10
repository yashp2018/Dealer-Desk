export function overdueDays(dueAt: string): number {
  const diff = Date.now() - new Date(dueAt).getTime()
  return diff > 0 ? Math.floor(diff / 86400000) : 0
}

export function isOverdue(dueAt: string): boolean {
  return new Date(dueAt).getTime() < Date.now()
}
