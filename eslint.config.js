const reactNative = require('@react-native/eslint-config');

module.exports = [
  ...reactNative,
  {
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
  },
];