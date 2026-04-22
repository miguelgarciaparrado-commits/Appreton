// Jest config aislado del build Expo.
// Expo no necesita Babel config extra en runtime.
// Jest si — usa babel-jest con preset-env para parsear los ES modules de src/.
module.exports = {
  testMatch: ['**/__tests__/**/*.test.js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      babelrc: false,
      configFile: false,
    }],
  },
};
