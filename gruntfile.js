module.exports = function (grunt) {
  grunt.initConfig({
    copy:{
      config:{expand: true, cwd:'src', src:['**/*.json'], dest:'build/', filter:'isFile'}
    }
  });
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['copy']);
};
