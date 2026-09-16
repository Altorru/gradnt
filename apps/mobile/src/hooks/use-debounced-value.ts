import { useEffect, useState } from 'react'

/**
 * The value, but only once it has stopped changing.
 *
 * A drag reports every step it crosses, and each step that reaches the network
 * costs three requests against a quota of forty a minute — so a single slow drag
 * across a slider is enough to exhaust it, and the screen fills with failures
 * that have nothing to do with what the rider chose.
 *
 * The live value stays where it is: the control renders it immediately. Only the
 * value that reaches the network waits.
 */
export function useDebouncedValue<T>(value: T, delayMs = 500): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setSettled(value), delayMs)

    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return settled
}
