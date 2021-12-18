module.exports = function (grunt) {
  grunt.initConfig({
    uglify:{files:{src:'src/public/js/*.js', dest:'build/public/js', mangle:true, expand:true, flatten:true}},
    watch:{
      js:{files:'src/public/js/*.js', tasks:['uglify']}, 
      views:{files:'src/views/*.pug', tasks:['copy']}},
    copy:{
      views:{expand:true, flatten:true, src:'src/views/*', dest:'build/views/', filter:'isFile'},
      config:{expand: true, cwd:'src', src:['**/*.json'], dest:'build/', filter:'isFile'}
    }
  });
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['uglify', 'copy']);
};
