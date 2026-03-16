import * as monaco from 'monaco-editor'

export const ctxdslLanguageId = 'ctxdsl'

export const ctxdslLanguageDefinition: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      // Keywords
      [
        /(context|alphabet|automata|automaton|states|state|transitions|transition|formulas|formula|controllers|controller|label|initial|accepting|on|with|guard|effect|action|vars|actions)/,
        'keyword',
      ],
      // Strings
      [/"[^"]*"/, 'string'],
      [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
      // Numbers
      [/\d+/, 'number'],
      // Operators
      [/[{}[\](),;:->]/, 'delimiter'],
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*[\s\S]*?\*\//, 'comment'],
      // Whitespace
      [/\s+/, 'white'],
    ],
  },
}

export const registerCtxdslLanguage = (monacoInstance: typeof monaco) => {
  // Check if already registered to avoid duplicate registration errors
  const languages = monacoInstance.languages.getLanguages()
  const isRegistered = languages.some(lang => lang.id === ctxdslLanguageId)

  if (!isRegistered) {
    monacoInstance.languages.register({ id: ctxdslLanguageId })
  }

  monacoInstance.languages.setMonarchTokensProvider(ctxdslLanguageId, ctxdslLanguageDefinition)

  // Language configuration
  monacoInstance.languages.setLanguageConfiguration(ctxdslLanguageId, {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
  })
}
