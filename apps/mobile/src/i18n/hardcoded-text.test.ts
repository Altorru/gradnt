/// <reference types="vite/client" />
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * Visible text belongs in the catalogue, and this is what says so.
 *
 * Written after the same bug was fixed five times — a workout card, a goal
 * card, a Strava block, a service, the settings screen — each found by hand and
 * each missed by the sweep before it. Grepping cannot do this job: the strings
 * that hid longest were in template literals and prop defaults, and a regex for
 * JSX text matches every `<` and `>` in a ternary.
 *
 * So it parses. Three shapes are checked, and each one found real French:
 *
 * - text between tags, `<GradntText>OBJECTIF PRINCIPAL</GradntText>`
 * - a string literal on a prop that is read aloud or shown, `label="Objectif"`
 * - a template literal inside JSX that reads as a sentence, `` `il y a ${n} sem.` ``
 *
 * A translation is an expression — `{t('...')}` — so anything that is not an
 * expression is suspect by construction.
 *
 * The sources come from Vite rather than `fs`: this runs inside the app, whose
 * tsconfig has no Node types, and adding them would give every screen a Node
 * `setTimeout`.
 */
const SOURCES = import.meta.glob('../**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Props whose value a rider ends up reading or hearing. */
const TEXT_PROPS = new Set([
  'title',
  'label',
  'description',
  'placeholder',
  'action',
  'accessibilityLabel',
  'hint',
  'subtitle',
  'eyebrow',
])

/**
 * Words that are not translated, and should not be.
 *
 * Brand names, an initialism, and the unit symbols — `W` and `km` read the same
 * in both catalogues, which is why they live beside the codes rather than in
 * the catalogue.
 */
const ALLOWED = new Set([
  'STRAVA',
  'FTP',
  'W',
  'km',
  'm',
  'h',
  'GRADNT',
  'RADNT',
  'Beta',
  // The map attribution: OpenFreeMap, MapLibre and HeiGIT are data providers'
  // names, and no rider reads a translated one.
  '· OpenFreeMap · MapLibre · HeiGIT',
])

type Violation = { where: string; kind: string; text: string }

/** Two letters together, so punctuation and single glyphs are not text. */
const WORDS = /[A-Za-zÀ-ÿ]{2,}/

/** A run of three letters: `km` is a unit, `sem` is a word. */
const WORD_RUN = /[A-Za-zÀ-ÿ]{3,}/

function violationsIn(name: string, source: string): Violation[] {
  const parsed = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found: Violation[] = []
  const relative = name.replace(/^\.\.\//, '')

  function at(node: ts.Node) {
    return `${relative}:${parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1}`
  }

  function walk(node: ts.Node, insideJsx: boolean): void {
    const inJsx = insideJsx || ts.isJsxExpression(node)

    if (ts.isJsxText(node)) {
      const text = node.text.trim()

      if (WORDS.test(text) && !ALLOWED.has(text)) {
        found.push({ where: at(node), kind: 'text between tags', text })
      }
    }

    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const prop = node.name.getText(parsed)
      const value = node.initializer.text

      if (TEXT_PROPS.has(prop) && WORDS.test(value) && !ALLOWED.has(value)) {
        found.push({ where: at(node), kind: `literal on ${prop}`, text: value })
      }
    }

    if (insideJsx && (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
      /**
       * The literal parts only.
       *
       * The expressions are code — identifiers and arithmetic — and reading them
       * as prose flags every `viewBox` and every `${index + 1}`. What can be a
       * sentence is the text between them.
       */
      const parts = ts.isTemplateExpression(node)
        ? [node.head.text, ...node.templateSpans.map((span) => span.literal.text)]
        : [node.text]
      // Joined with nothing: the separator belongs to an expression, not to the
      // sentence, and inventing one turns `url(#${id})` into prose.
      const written = parts.join('')

      // A space and a word: an SVG id or a route path has neither.
      if (written.includes(' ') && WORD_RUN.test(written) && !ALLOWED.has(written.trim())) {
        found.push({ where: at(node), kind: 'template literal in JSX', text: written.trim() })
      }
    }

    ts.forEachChild(node, (child) => walk(child, inJsx))
  }

  walk(parsed, false)

  return found
}

describe('visible text comes from the catalogue', () => {
  it('finds none written into a component', () => {
    const violations = Object.entries(SOURCES).flatMap(([name, source]) =>
      violationsIn(name, source),
    )

    const report = violations
      .map((violation) => `  ${violation.where}  [${violation.kind}]  ${violation.text}`)
      .join('\n')

    // The list rather than the count: a failure has to say what to move.
    expect(violations.length === 0 ? '' : `\n${report}\n`).toBe('')
  })

  it('reaches the whole app, so a passing run means something', () => {
    const names = Object.keys(SOURCES)

    expect(names.length).toBeGreaterThan(40)
    expect(names.some((name) => name.endsWith('screens/SettingsScreen.tsx'))).toBe(true)
    expect(names.some((name) => name.endsWith('onboarding/screens/WelcomeScreen.tsx'))).toBe(true)
  })
})
