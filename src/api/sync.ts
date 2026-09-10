// Offline sync stubs — for future PWA/mobile use
export const syncBatch = async (_mutations: unknown[]) => ({ synced: 0 })
export const syncChanges = async () => ({ changes: [] })
