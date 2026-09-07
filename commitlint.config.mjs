import conventional from '@commitlint/config-conventional'

const gitmojiTypes = {
  '✨': ['feat'],
  '🐛': ['fix'],
  '🚑️': ['fix'],
  '♻️': ['refactor'],
  '💄': ['style'],
  '📝': ['docs'],
  '✅': ['test'],
  '⚡️': ['perf'],
  '🔧': ['chore'],
  '👷': ['ci'],
  '📦️': ['build'],
  '⬆️': ['chore'],
  '⬇️': ['chore'],
  '🔒️': ['fix'],
  '🔥': ['refactor'],
  '🎉': ['chore'],
  '⏪️': ['revert'],
  '🔖': ['chore'],
  '🖼️': ['chore'],
}

const types = [
  'feat',
  'fix',
  'refactor',
  'style',
  'docs',
  'test',
  'perf',
  'chore',
  'ci',
  'build',
  'revert',
]

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const emojiPattern = Object.keys(gitmojiTypes)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join('|')

const headerPattern = new RegExp(
  `^(${emojiPattern})\\s+([a-z]+)(?:\\(([^)]+)\\))?(!)?:\\s+(.+)$`,
  'u',
)

const gitmojiTypeMatch = ({ header }) => {
  const match = header?.match(headerPattern)

  if (!match) {
    return [
      false,
      'use: <gitmoji> <type>(<scope>): <description> — e.g. ✨ feat(mobile): add onboarding',
    ]
  }

  const [, emoji, type] = match
  const allowedTypes = gitmojiTypes[emoji]

  if (!allowedTypes?.includes(type)) {
    return [false, `${emoji} must be used with ${allowedTypes?.join(' or ')}`]
  }

  return [true]
}

export default {
  extends: ['@commitlint/config-conventional'],

  parserPreset: {
    name: 'gradnt-gitmoji',
    parserOpts: {
      headerPattern,
      headerCorrespondence: ['emoji', 'type', 'scope', 'breaking', 'subject'],
    },
  },

  plugins: [
    {
      rules: {
        'gitmoji-type-match': gitmojiTypeMatch,
      },
    },
  ],

  rules: {
    ...conventional.rules,
    'gitmoji-type-match': [2, 'always'],
    'type-enum': [2, 'always', types],
    'type-case': [2, 'always', 'lower-case'],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
}
