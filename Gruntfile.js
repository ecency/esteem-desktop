module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-search');
    grunt.loadNpmTasks('grunt-comment-toggler');

    var packager = require('electron-packager');

    const BUILD_DIR = 'build/';
    const DIST_DIR = 'dist/';
    const APP_NAME = 'eSteem';
    const PLATFORM = 'all';
    const ARCH = 'all';
    const ELECTRON_VERSION = '1.2.3';
    const USE_ASAR = true;
    const ICON = 'assets/icon';

    var toggleCommentsFiles = {files:{}};
    toggleCommentsFiles.files[BUILD_DIR + 'main.js'] = 'main.js';

    // Project configuration.
    grunt.initConfig(
        {
            pkg: grunt.file.readJSON('package.json'),
            uglify: {
                production: {
                    files: [
                        {
                            src : 'scripts/**/*.js',
                            dest : BUILD_DIR + '/scripts/app.angular.min.js'
                        },
                        {
                            expand: true,
                            src: BUILD_DIR + 'main.js'
                        }
                    ]
                }
            },
            copy: {
                electron_app: {
                    files: [
                        {
                            expand: true,
                            src: ['index.html', 'main.js', 'package.json'],
                            dest: BUILD_DIR
                        }
                    ]
                },
                angular_app_html: {
                    files: [
                        {
                            expand: true,
                            src: ['scripts/**/*.*', 'bower_components/**/*.js'],
                            dest: BUILD_DIR
                        }
                    ]
                }
            },
            search: {
                node_modules_dependencies: {
                    files: {
                        src: ['index.html']
                    },
                    options: {
                        searchString: /="node_modules\/.*?"/g,
                        logFormat: "custom",
                        onMatch: function (match) {
                            var filePath = match.match.substring(
                                2,
                                match.match.length - 1
                            );
                            grunt.file.copy(filePath, BUILD_DIR + filePath);
                            console.log('Found dependency: ' + filePath)
                        },
                        customLogFormatCallback: function (params) {
                        }
                    }
                }
            },
            toggleComments: {
                customOptions: {
                    padding: 1,
                    removeCommands: false
                },
                files: toggleCommentsFiles
            }
        }
    );

    grunt.registerTask(
        'build',
        [
            'clean',
            'copy:electron_app',
            'copy:angular_app_html',
            'toggleComments',
            'search:node_modules_dependencies',
            'install_node_dependencies',
            'install_steem-rpc',
            'install_steemjs-lib',
            //'uglify:production',
            'package',
            'fix_default_app'
        ]
    );

    // Clean the build directory
    grunt.registerTask(
        'clean',
        function () {
            if (grunt.file.isDir(BUILD_DIR)) {
                grunt.file.delete(BUILD_DIR, {force: true});
            }
        }
    );

    grunt.registerTask(
        'package',
        function () {
            var done = this.async();
            packager(
                {
                    dir: BUILD_DIR,
                    out: DIST_DIR,
                    name: APP_NAME,
                    platform: PLATFORM,
                    arch: ARCH,
                    version: ELECTRON_VERSION,
                    asar: USE_ASAR,
                    icon: ICON
                },
                function (err) {
                    if (err) {
                        grunt.warn(err);
                        return;
                    }

                    done();
                }
            );
        }
    );

    grunt.registerTask(
        'install_node_dependencies',
        function () {
            var exec = require('child_process').exec;
            var cb = this.async();
            exec('npm install', {cwd: './build'}, function(err, stdout, stderr) {
                console.log(stdout);
                cb();
            });
        }
    );
    grunt.registerTask(
        'install_steem-rpc',
        function () {
            var exec = require('child_process').exec;
            var cb = this.async();
            exec('npm install', {cwd: './build/node_modules/steem-rpc'}, function(err, stdout, stderr) {
                console.log(stdout);
                cb();
            });
        }
    );
    grunt.registerTask(
        'install_steemjs-lib',
        function () {
            var exec = require('child_process').exec;
            var cb = this.async();
            exec('npm install', {cwd: './build/node_modules/steemjs-lib'}, function(err, stdout, stderr) {
                console.log(stdout);
                cb();
            });
        }
    );

    // Used as a temporary fix for:
    // https://github.com/maxogden/electron-packager/issues/49
    grunt.registerTask(
        'fix_default_app',
        function () {

            var default_apps = grunt.file.expand(
                DIST_DIR + APP_NAME + '*/resources/default_app'
            );

            default_apps.forEach(
                function (folder) {
                    console.log('Removing ' + folder);
                    grunt.file.delete(folder);
                }
            );
        }
    );
};