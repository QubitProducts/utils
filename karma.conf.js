module.exports = function (config) {
  config.set({
    frameworks: ['mocha'],
    files: ['test/*'],
    preprocessors: {
      'test/*.js': ['webpack', 'sourcemap']
    },
    webpackMiddleware: {
      stats: 'errors-only',
      logLevel: 'error'
    },
    reporters: ['progress'],
    webpack: {
      mode: 'development',
      watch: true,
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /.*\.js$/,
            use: [
              {
                loader: '@qubit/buble-loader',
                options: {
                  objectAssign: 'require("slapdash").assign',
                  transforms: {
                    dangerousForOf: true,
                    dangerousTaggedTemplateString: true
                  }
                }
              }
            ]
          }
        ]
      }
    },
    browsers: ['Chrome']
  })
}
