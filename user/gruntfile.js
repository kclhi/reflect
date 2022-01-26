module.exports = function (grunt) {
  grunt.initConfig({
    uglify:{files:{src:'src/public/js/*.js', dest:'build/public/js', mangle:true, expand:true, flatten:true}},
    watch:{
      js:{files:'src/public/js/*.js', tasks:['uglify']},
      css:{files:'src/public/css/*.css', tasks:['copy']},
      views:{files:'src/views/*.pug', tasks:['copy']},
      images:{files:'src/public/images/*.*', tasks:['copy']}
    },
    copy:{
      css:{expand:true, flatten:true, src:'src/public/css/*.css', dest:'build/public/css', filter:'isFile'},
      views:{expand:true, flatten:true, src:'src/views/*', dest:'build/views/', filter:'isFile'},
      images:{expand:true, flatten:true, src:'src/public/images/*', dest:'build/public/images/', filter:'isFile'},
      config:{expand: true, cwd:'src', src:['**/*.json'], dest:'build/', filter:'isFile'}
    }
  });
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['uglify', 'copy']);
};
