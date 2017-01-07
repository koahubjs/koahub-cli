"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = watch;

var _chokidar = require("chokidar");

var _chokidar2 = _interopRequireDefault(_chokidar);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

function delDirs(path) {
    var files = [];
    if (_fs2.default.existsSync(path)) {
        files = _fs2.default.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (_fs2.default.statSync(curPath).isDirectory()) {
                // recurse
                delDirs(curPath);
            } else {
                // delete file
                _fs2.default.unlinkSync(curPath);
            }
        });
        _fs2.default.rmdirSync(path);
    }
};

function watch(appName, runtimeName, callback) {

    var watcher = _chokidar2.default.watch(appName, {
        ignored: /[\/\\]\./,
        persistent: true,
        ignoreInitial: true
    });

    watcher.on('add', function (filePath, stats) {

        var fileRuntimePath = filePath.replace("" + appName, "" + runtimeName);
        mkdirsSync(_path2.default.dirname(fileRuntimePath));

        callback(filePath);
    });

    watcher.on('change', function (filePath, stats) {

        callback(filePath);
    });

    watcher.on('unlink', function (filePath, stats) {

        var runtimePath = filePath.replace("" + appName, "" + runtimeName);
        _fs2.default.unlinkSync(runtimePath);

        callback(filePath, false);
    });

    watcher.on('unlinkDir', function (dirPath) {

        var dirRuntimePath = dirPath.replace("" + appName, "" + runtimeName);
        delDirs(dirRuntimePath);
    });
}
//# sourceMappingURL=watch.util.js.map