export default {
  source: ['design-tokens/**/*.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'tokens.gen.css',
          format: 'css/variables',
          options: { outputReferences: true },
        },
      ],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'src/styles/',
      files: [{ destination: 'tokens.gen.ts', format: 'javascript/es6' }],
    },
  },
}
