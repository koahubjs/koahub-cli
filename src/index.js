import fs from "fs";
import path from "path";
import child_process from "child_process";
import shell from "shelljs";
import program from "commander";
import notifier from "node-notifier";
import watch from "./util/watch.util";
import { debug } from "./util/log.util";
import config from "./config/index.config";
import packageFile from "./../package.json";

function fileCopySync(src, dest) {
    fs.writeFileSync(dest, fs.readFileSync(src));
}

program
    .version(packageFile.version)

program
    .command('start [script]')
    .description('koahub start script --watch --compile')
    .option('-w, --watch', 'auto restart when a file is modified')
    .option('-c, --compile', 'auto babel process when a file is modified')
    .option('-r, --runtime [dir]', 'Babel compile and start the dir')
    .action(function(script, options) {

        const rootPath = process.cwd();
        const appName = path.dirname(script) || config.app;
        const appPath = path.resolve(rootPath, appName);
        const appFile = path.resolve(rootPath, script);
        const runtimeName = options.runtime || config.runtime;
        const runtimePath = path.resolve(rootPath, runtimeName);
        const runtimeFile = path.resolve(rootPath, script.replace(`${appName}`, `${runtimeName}`));

        const binPath = path.resolve(process.mainModule.filename, '../../');
        const babel = path.resolve('node_modules/.bin/babel');

        // 监控启动
        if (options.watch) {

            // 编译并且监控启动
            if (options.compile) {
                shell.exec(path.normalize(`${babel} ${appName} --out-dir ${runtimeName}`));
            }

            let runtimeProcess;

            function startRuntimeProcess(runtimeFile) {
                notifier.notify({
                    title: 'KoaHub.js',
                    message: '启动成功',
                    icon: path.resolve(binPath, 'icons/info.png')
                });
                runtimeProcess = child_process.fork(runtimeFile);
                runtimeProcess.on('exit', function(code, signal) {
                    if (runtimeProcess.connected == false) {
                        process.exit();
                    }
                });
            }

            function stopRuntimeProcess() {
                if (runtimeProcess) runtimeProcess.kill();
            }

            // 启动运行时进程
            startRuntimeProcess(runtimeFile);

            // 捕获SIGTERM退出信号
            process.on('SIGTERM', function() {
                stopRuntimeProcess();
                process.exit();
            });

            // 捕获未知错误
            process.on('uncaughtException', function(err) {
                debug(err);
            });

            let time = new Date();
            let files = [];
            // 开启文件监控
            watch(appName, runtimeName, function(filePath, compile = true) {

                if (options.compile == true && compile == true) {
                    let fileRuntimePath = filePath.replace(`${appName}`, `${runtimeName}`);
                    files.push({ filePath: filePath, fileRuntimePath: fileRuntimePath });
                }

                let newTime = new Date();
                let timeOut = setTimeout(function() {
                    if (files.length) {
                        for (let key in files) {
                            shell.exec(path.normalize(`${babel} ${files[key].filePath} --out-file ${files[key].fileRuntimePath}`));
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

            return;
        }

        // 直接编译启动
        if (options.compile) {
            shell.exec(path.normalize(`${babel} ${appName} --out-dir ${runtimeName}`));
        }

        // 直接启动
        require(runtimeFile);
    });

program
    .command('controller [file]')
    .description('koahub create controller')
    .action(function(file) {

        const destFile = path.normalize(`${file}.controller.js`);
        const srcFile = path.normalize(path.resolve(binPath, 'template/controller/index.controller.js'));

        fileCopySync(srcFile, destFile);
    });

program
    .command('create [project]')
    .description('koahub create project')
    .action(function(project) {

        shell.exec('git clone https://github.com/einsqing/koahubjs-demo.git');
        fs.renameSync(path.resolve('koahubjs-demo'), path.resolve(project));
    });

program.parse(process.argv);

if (!program.args.length) program.help();
