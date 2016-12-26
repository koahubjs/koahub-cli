## 介绍

KoaHub CLI -- KoaHub.js的开发工具，自动babel编译 ES6/7（Generator Function, Class, Async & Await）并且文件修改后自动重启。

## 安装使用
```sh

//安装：npm install koahub-cli -g
//使用：
koahub

Usage: koahub [options] [command]

Commands:

start [options] [script]  koahub start script --watch --compile
controller [name]         koahub create controller
create [project]          koahub create project

Options:

-h, --help     output usage information
-V, --version  output the version number

Examples:

koahub start app/index.js --watch --compile --runtime runtime (文件修改自动编译到runtime并且重启）
koahub controller app/controller/home/article (自动创建控制器模版）
koahub create koahub-demo (自动初始化项目)
```


## KoaHub.js
[KoaHub.js框架](https://github.com/einsqing/koahubjs)

## 官网
[KoaHub.js官网](http://js.koahub.com)