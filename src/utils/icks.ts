export const ICKS_UPDATED_EVENT = 'slopesenders:icks-updated'

export function dispatchIcksUpdatedEvent() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ICKS_UPDATED_EVENT))
}
