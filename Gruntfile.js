module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);
  grunt.initConfig({
    eslint: {
      src: ["lib/**/*.js"]
    },
    mochaTest: {
      test: {
        src: ['lib/**/*-spec.js'],
        options: {
          reporter: 'Spec',
          logErrors: true,
          timeout: 1500,
          run: true
        }
      }
    }
  });
  grunt.registerTask('test', ['eslint', 'mochaTest']);
  grunt.registerTask('default', ['test']);
};
