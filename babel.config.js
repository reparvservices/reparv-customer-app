module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    // Release bundles: drop console.log/info/debug (they leak user data to logcat)
    production: {
      plugins: [['transform-remove-console', {exclude: ['error', 'warn']}]],
    },
  },
};
