#!/usr/bin/env node
const fs = require('fs');
const request = require('sync-request');
const argv = require('minimist')(process.argv.slice(2));
const version = require('./package.json').version;

const low = require('lowdb');
const db = low('db.json');

const AlfredNode = require('alfred-workflow-nodejs');
const actionHandler = AlfredNode.actionHandler;
const workflow = AlfredNode.workflow;
const Item = AlfredNode.Item;

var token = "";

// 获取 Token 参数（共有两种设置方式）
if (argv.t || argv.token) {
    // 通过参数设置 Token
    token = typeof (argv.t || argv.token) === 'string' ? (argv.t || argv.token).trim() : '';
} else {
    // 通过配置设置 Token
    var configPath = (process.env.HOME || process.env.USERPROFILE) + '/.acw_config.json';
    try {
        var config = JSON.parse(fs.readFileSync(configPath));
        token = config.token;
    } catch (e) { }
}

// 未设置 Token 错误提醒
if (token == "") {
    workflow.addItem(new Item({
      valid: true, icon: AlfredNode.ICONS.ERROR,
      title: "令牌未配置，按下 Return 键查看配置说明",
      arg: "https://github.com/lijy91/alfred-coding-workflow"
    }));
// 搜索 Coding 项目
} else {
    // 获取关键字参数
    var query = '';
    var queryReg;

    // 清空缓存数据
    if (argv.c || argv.clear) {
        db('projects').remove({});
        db('config').remove({});
        workflow.addItem(new Item({
          valid: true, icon: AlfredNode.ICONS.INFO,
          title: "数据缓存已清空"
        }));
    } else if (argv.q || argv.query) {
        query = typeof (argv.q || argv.query) === 'string' ? (argv.q || argv.query).trim() : '';
        queryReg = new RegExp(query, "i")

        if (query.length === 0) {
            workflow.addItem(new Item({
              valid: true, icon: AlfredNode.ICONS.ERROR,
              title: "搜索参数未配置，按下 Return 键查看配置说明",
              arg: "https://github.com/lijy91/alfred-coding-workflow"
            }));
        } else {
            // 判断更新时间
            var now = new Date().getTime();
            var updateAt = 0;
            var updateAtConfig = db('config').find({key:'project_update_at'});
            if (updateAtConfig !== undefined) {
                updateAt = updateAtConfig.value;
            }
            // 如果上次更新时间超过1小时，或者从未更新过，则更新数据
            if ((now - updateAt) >= (3600 * 1000) || updateAt == 0) {
                // 清空缓存数据
                db('projects').remove({});
                db('config').remove({});
                // 获取代码库版本信息
                var updateRes = request('GET', 'https://raw.githubusercontent.com/lijy91/alfred-coding-workflow/master/package.json');
                try {
                    var updateRet = JSON.parse(updateRes.body);
                    // 保存更新时间戳
                    db('config').remove({ key: 'remote_version' });
                    db('config').push({ key: 'remote_version', value: updateRet.version });
                } catch (e) { }
                var response = request('GET', 'https://coding.net/api/user/projects?page=1&pageSize=100&access_token=' + token);
                try {
                    var result = JSON.parse(response.body);
                    // 返回的状态码不为 0
                    if (result.code !== 0) {
                        if (result.code == 3016) {
                            workflow.addItem(new Item({
                              valid: true, icon: AlfredNode.ICONS.ERROR,
                              title: "无效的令牌，按下 Return 键查看配置说明",
                              arg: "https://github.com/lijy91/alfred-coding-workflow"
                            }));
                        }
                    } else {
                        result.data.list.forEach(function(project) {
                            // 替换会出现转义符的情况
                            var description = project.description
                              .replace('\n', '')
                              .replace('\r', '')
                              .replace('\t', '')
                              .replace('\b', '')
                              .replace('\f', '');
                            db('projects').push({
                                id: project.id,
                                icon: project.icon,
                                name: project.name,
                                description: description,
                                https_url: project.https_url,
                                is_public: project.is_public
                            });
                        });
                        // 保存更新时间戳
                        db('config').remove({ key: 'project_update_at' });
                        db('config').push({ key: 'project_update_at', value: now });
                    }
                } catch(e) {
                    db('projects').remove({});
                    db('config').remove({});
                    // Not a valid JSON response
                    workflow.addItem(new Item({
                      valid: true, icon: AlfredNode.ICONS.ERROR,
                      title: "Not a valid JSON response",
                      arg: "https://github.com/lijy91/alfred-coding-workflow/issues"
                    }));
                }
            }
            // 新版本提醒
            var versionConfig = db('config').find({key:'remote_version'});
            if (versionConfig !== undefined && versionConfig.value > version) {
              workflow.addItem(new Item({
                uid: 0,
                valid: true, icon: AlfredNode.ICONS.SYNC,
                title: "发现新版本，按下 Return 键查看更新",
                arg: "https://github.com/lijy91/alfred-coding-workflow"
              }));
            }
            // 筛选项目
            var count = 0;
            if (db('projects').size() > 0) {
                var projects = db('projects').value();
                projects.forEach(function(project) {
                    if (queryReg.test(project.name)) {
                        var projectItem = new Item({
                            uid: project.id,
                            title: project.name,
                            subtitle: (project.is_public ? "[公开] " : "[私有] ") + project.description,
                            valid: true, icon: AlfredNode.ICONS.WEB,
                            arg: project.https_url
                        });
                        workflow.addItem(projectItem);
                        count += 1;
                    }
                });
            }
            if (count == 0) {
                workflow.addItem(new Item({
                  valid: true, icon: AlfredNode.ICONS.WARNING,
                  title: "没有符合条件的项目"
                }));
            }
        }
    }
}

try {
    workflow.feedback();
} catch (e) {
    workflow.clearItems();
    workflow.addItem(new Item({
      valid: true, icon: AlfredNode.ICONS.ERROR,
      title: "发生异常，按下 Return 键提交反馈",
      arg: "https://github.com/lijy91/alfred-coding-workflow/issues"
    }));
    workflow.feedback();
}
