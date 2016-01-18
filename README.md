# alfred-coding-workflow

基于 Alfred2 Workflows 的 Coding 个人项目快速搜索插件

## 使用
### 依赖
本插件依赖 [Alfred 2](https://www.alfredapp.com/)

P.S.: 你需要 [购买 Powerpack](https://buy.alfredapp.com/) 才能使用本插件

### 安装

[下载](https://github.com/lijy91/alfred-coding-workflow/blob/master/release/coding-1.0.0.alfredworkflow?raw=true)


### 配置
[获取Token](http://acw.coding.io)
```bash
$ cd ~/
$ touch .acw_config
$ echo ACCESS_TOKEN = <Token> .acw_config
```

### 用法
- `option + space` 启动 Alfred 2
- 输入前缀 `c ` 再输入搜索关键字即可以

## 开发

### 克隆源码到 Alfred 2 插件目录

```bash
$ cd ~/Library/Application\ Support/Alfred\ 2/Alfred.alfredpreferences/workflows
$ git clone git@github.com:lijy91/alfred-coding-workflow.git user.workflow.060322F2-E9AE-4758-BCDE-39FFC36C4D10
$ cd user.workflow.060322F2-E9AE-4758-BCDE-39FFC36C4D10
$ npm install
$ atom .
```

# License

    Copyright (C) 2015 LiJianying<lijy91@foxmail.com>

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
