## 介绍

KoaHub CLI -- KoaHub.js的开发工具，自动Babel编译 ES6/7（Generator Function, Class, Async & Await）并且文件修改后自动重启。

## 特性
1. ​自动重启
2. 自动Babel编译
3. 自动创建控制器
4. 支持全局命令行
5. 支持模块启动
6. ...

## 支持
```js
require('koahub-cli').run('start app/index.js --watch --compile');
```


## 安装使用
```sh

//安装：npm install github:koahubjs/koahub-cli -g
//使用：
koahub

Usage: koahub [options] [command]

Commands:

start [options] [script]  koahub start script --watch --compile
controller [name]         koahub create controller

Options:

-h, --help     output usage information
-V, --version  output the version number

Examples:

koahub start app/index.js --watch --compile --runtime runtime (文件修改自动编译到runtime并且重启）
koahub controller app/controller/home/article (自动创建控制器模版）
```


## KoaHub.js
[KoaHub.js框架](https://github.com/koahubjs/koahub)

## 官网
[KoaHub.js官网](http://js.koahub.com)