"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

exports.run = run;

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _child_process = require("child_process");

var _child_process2 = _interopRequireDefault(_child_process);

var _shelljs = require("shelljs");

var _shelljs2 = _interopRequireDefault(_shelljs);

var _commander = require("commander");

var _commander2 = _interopRequireDefault(_commander);

var _watch = require("./util/watch.util");

var _watch2 = _interopRequireDefault(_watch);

var _log = require("./util/log.util");

var _log2 = _interopRequireDefault(_log);

var _index = require("./config/index.config");

var _index2 = _interopRequireDefault(_index);

var _package = require("./../package.json");

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fileCopySync(src, dest) {
    mkdirsSync(_path2.default.dirname(dest));
    _fs2.default.writeFileSync(dest, _fs2.default.readFileSync(src));
    (0, _log2.default)("[File] " + _path2.default.relative(process.cwd(), src));
}

function getCliPath() {

    var binPath = void 0;
    if (process.mainModule.filename.indexOf('koahub-cli') != -1) {
        binPath = _path2.default.resolve(process.mainModule.filename, '../../');
    } else {
        binPath = _path2.default.resolve(process.cwd(), 'node_modules/koahub-cli');
    }

    return binPath;
}

function getBabelPath() {
    return _path2.default.resolve('node_modules/.bin/babel');
}

function getKoahubPath() {
    return _path2.default.resolve('node_modules/.bin/koahub');
}

function getRuntimeFile(file, appName, runtimeName) {
    return file.replace("" + appName, "" + runtimeName);
}

function walk(dir) {

    var exist = _fs2.default.existsSync(dir);
    if (!exist) {
        return;
    }

    var files = _fs2.default.readdirSync(dir);
    var list = [];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = (0, _getIterator3.default)(files), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var file = _step.value;

            if (_fs2.default.statSync(_path2.default.resolve(dir, file)).isDirectory()) {
                list = list.concat(walk(_path2.default.resolve(dir, file)));
            } else {
                list.push(_path2.default.resolve(dir, file));
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return list;
}

function mkdirsSync(dirname, mode) {

    if (_fs2.default.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(_path2.default.dirname(dirname), mode)) {
            _fs2.default.mkdirSync(dirname, mode);
            return true;
        }
    }
}

function compileByBabel(file, appName, runtimeName) {

    var runtimeFile = getRuntimeFile(file, appName, runtimeName);
    if (!checkFileExtensions(file)) {
        if (_path2.default.basename(file) != '.DS_Store') {
            fileCopySync(file, runtimeFile);
        }
        return;
    }

    mkdirsSync(_path2.default.dirname(runtimeFile));

    var content = _fs2.default.readFileSync(file);
    var babel = require('babel-core');
    var data = babel.transform(content, {
        filename: file,
        presets: ['es2015', 'stage-3'],
        plugins: ['transform-runtime']
    });

    _fs2.default.writeFileSync("" + runtimeFile, data.code);

    (0, _log2.default)("[Babel] " + _path2.default.relative(process.cwd(), file));
}

function checkFileExtensions(file) {

    var extensions = ['.js', '.jsx', '.es6', '.es'];
    var regExp = void 0,
        validate = false;
    for (var key in extensions) {
        regExp = new RegExp(extensions[key] + "$");
        if (regExp.test(file)) {
            validate = true;
        }
    }
    return validate;
}

function checkFilesChange(appName, runtimeName) {

    var changedFiles = [];
    var files = walk(appName);

    for (var key in files) {
        var mTimeApp = _fs2.default.statSync(files[key]).mtime.getTime();
        var runtimeFile = getRuntimeFile(files[key], appName, runtimeName);

        if (_fs2.default.existsSync(runtimeFile)) {
            var mTimeRuntime = _fs2.default.statSync(runtimeFile).mtime.getTime();
            if (mTimeRuntime < mTimeApp) {
                changedFiles.push(files[key]);
            }
        } else {
            changedFiles.push(files[key]);
        }
    }

    return changedFiles;
}

_commander2.default.version(_package2.default.version);

_commander2.default.command('start [script]').description('koahub start script --watch --compile').option('-w, --watch', 'auto restart when a file is modified').option('-c, --compile', 'auto babel process when a file is modified').option('-r, --runtime [dir]', 'Babel compile and start the dir').action(function (script, options) {

    var rootPath = process.cwd();
    var appName = _path2.default.dirname(script) || _index2.default.app;
    var appPath = _path2.default.resolve(rootPath, appName);
    var appFile = _path2.default.resolve(rootPath, script);
    var runtimeName = options.runtime || _index2.default.runtime;
    var runtimePath = _path2.default.resolve(rootPath, runtimeName);
    var runtimeFile = _path2.default.resolve(rootPath, getRuntimeFile(script, appName, runtimeName));

    var cliPath = getCliPath();

    // 监控启动
    if (options.watch) {
        var _ret = function () {
            var startRuntimeProcess = function startRuntimeProcess(runtimeFile) {
                runtimeProcess = _child_process2.default.fork(runtimeFile);
                runtimeProcess.on('exit', function (code, signal) {
                    if (runtimeProcess.connected == false) {
                        process.exit();
                    }
                });
            };

            var stopRuntimeProcess = function stopRuntimeProcess() {
                if (runtimeProcess) runtimeProcess.kill();
            };

            // 启动运行时进程


            // 编译并且监控启动
            if (options.compile) {
                var changedFiles = checkFilesChange(appName, runtimeName);
                for (var key in changedFiles) {
                    compileByBabel(changedFiles[key], appName, runtimeName);
                }
            }

            var runtimeProcess = void 0;

            startRuntimeProcess(runtimeFile);

            // 捕获SIGTERM退出信号
            process.on('SIGTERM', function () {
                stopRuntimeProcess();
                process.exit();
            });

            // 捕获未知错误
            process.on('uncaughtException', function (err) {
                (0, _log.debug)(err);
            });

            var time = new Date();
            var files = [];
            // 开启文件监控
            (0, _watch2.default)(appName, runtimeName, function (filePath) {
                var compile = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;


                if (options.compile == true && compile == true) {
                    files.push(filePath);
                }

                var newTime = new Date();
                var timeOut = setTimeout(function () {
                    if (files.length) {
                        for (var _key in files) {
                            compileByBabel(files[_key], appName, runtimeName);
                        }
                        // 未编译文件清空
                        files = [];
                    }
                    // 进程退出
                    stopRuntimeProcess();
                    // 进程启动
                    startRuntimeProcess(runtimeFile);
                }, 100);

                if (newTime - time <= 100) {
                    clearTimeout(timeOut);
                }

                time = newTime;
            });

            return {
                v: void 0
            };
        }();

        if ((typeof _ret === "undefined" ? "undefined" : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
    }

    // 直接编译启动
    if (options.compile) {
        var changedFiles = checkFilesChange(appName, runtimeName);
        for (var key in changedFiles) {
            compileByBabel(changedFiles[key], appName, runtimeName);
        }
    }

    // 直接启动
    require(runtimeFile);
});

_commander2.default.command('controller [file]').description('koahub create controller').action(function (file) {

    var destFile = _path2.default.normalize(file + ".controller.js");
    var srcFile = _path2.default.resolve(getCliPath(), 'template/controller/index.controller.js');

    fileCopySync(srcFile, destFile);
});

_commander2.default.command('create [project]').description('koahub create project').action(function (project) {

    _shelljs2.default.exec('git clone https://github.com/einsqing/koahub-demo.git');
    _fs2.default.renameSync(_path2.default.resolve('koahub-demo'), _path2.default.resolve(project));
});

// mainMoule路径中含有koahub-cli为命令行启动
if (process.mainModule.filename.indexOf('koahub-cli') != -1) {
    _commander2.default.parse(process.argv);
    if (!_commander2.default.args.length) _commander2.default.help();
}

// 支持导入koahub-cli启动
function run(argv) {

    if (!argv) {
        _commander2.default.help();
        return;
    }

    var argvs = [];
    argvs.push(process.argv[0]);
    argvs.push(getKoahubPath());

    if (argv.indexOf(' ') != -1) {
        var argvt = argv.split(' ');
        for (var key in argvt) {
            argvs.push(argvt[key]);
        }
    } else {
        argvs.push(argv);
    }

    _commander2.default.parse(argvs);
}
//# sourceMappingURL=index.js.map