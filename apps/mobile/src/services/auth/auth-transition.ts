let pending: Promise<void> = Promise.resolve()

/** Account navigation waits until caches and credentials from the old scope are cleared. */
export function enqueueAuthTransition(operation: () => Promise<void>): Promise<void> {
  pending = pending.catch(() => undefined).then(operation)
  return pending
}

export function waitForAuthTransition(): Promise<void> {
  return pending
}
