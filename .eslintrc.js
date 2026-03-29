module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'warn',
    'prettier/prettier': [
      'error',
      {
        bracketSpacing: true,
        bracketSameLine: true,
        singleQuote: true,
        trailingComma: 'es5',
        arrowParens: 'avoid',
      },
    ],
  },
};