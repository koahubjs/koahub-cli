import chokidar from "chokidar";
import fs from "fs";
import path from "path";

function mkdirsSync(dirname, mode) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname), mode)) {
            fs.mkdirSync(dirname, mode);
            return true;
        }
    }
}

function delDirs(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            let curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                delDirs(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

export default function watch(appName, runtimeName, callback) {

    const watcher = chokidar.watch(appName, {
        ignored: /[\/\\]\./,
        persistent: true,
        ignoreInitial: true
    });

    watcher.on('add', function (filePath, stats) {

        const fileRuntimePath = filePath.replace(`${appName}`, `${runtimeName}`);
        mkdirsSync(path.dirname(fileRuntimePath));

        callback(filePath);
    });

    watcher.on('change', function (filePath, stats) {

        callback(filePath);
    });

    watcher.on('unlink', function (filePath, stats) {

        const runtimePath = filePath.replace(`${appName}`, `${runtimeName}`);
        fs.unlinkSync(runtimePath);

        callback(filePath, false);
    });

    watcher.on('unlinkDir', function (dirPath) {

        const dirRuntimePath = dirPath.replace(`${appName}`, `${runtimeName}`);
        delDirs(dirRuntimePath);
    });
}