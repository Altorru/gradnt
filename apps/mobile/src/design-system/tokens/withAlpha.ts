/**
 * Returns a colour at the given alpha, formatted as `rgba(...)`.
 *
 * `rgba()` rather than an eight-digit hex on purpose. Android's native format is
 * `#AARRGGBB` — alpha first — while React Native expects `#RRGGBBAA`, and the
 * two are easy to transpose without anything failing loudly. Every consumer
 * here accepts `rgba()` unambiguously: gradient stops, a native ripple, the
 * tab bar's indicator.
 *
 * Returns the input unchanged when it is not a six-digit hex, rather than
 * emitting an invalid colour.
 */
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex)

  if (!match) {
    return hex
  }

  const value = match[1]!
  const red = parseInt(value.slice(0, 2), 16)
  const green = parseInt(value.slice(2, 4), 16)
  const blue = parseInt(value.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
