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

// 筛选项目
function filtering() {
    var count = 0;
    var projects = db('projects').value();
    projects.forEach(function(project) {
        if (queryReg.test(project.name)) {
            var projectItem = new Item({
                uid: project.id,
                title: project.name,
                subtitle: project.is_public ? "[公开]" : "[私有]" + " " + project.description,
                valid: true, icon: AlfredNode.ICONS.WEB,
                arg: project.https_url,
                autocomplete: "autocomplete"}
            );
            workflow.addItem(projectItem);
            count += 1;
        }
    });
    if (count == 0) {
        workflow.addItem(new Item({
          valid: true, icon: AlfredNode.ICONS.WARNING,
          title: "没有符合条件的项目"
        }));
    }
}

var token = "";

// 清空缓存数据
if (argv.c || argv.clear) {
    db('projects').remove({});
}
// 判断版本更新

// 设置 Token
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

    if (argv.q || argv.query) {
        query = typeof (argv.q || argv.query) === 'string' ? (argv.q || argv.query).trim() : '';
        queryReg = new RegExp(query, "i")
    }

    if (query.length === 0) {
        workflow.addItem(new Item({
          valid: true, icon: AlfredNode.ICONS.ERROR,
          title: "搜索参数未配置，按下 Return 键查看配置说明",
          arg: "https://github.com/lijy91/alfred-coding-workflow"
        }));
    } else {
        if (db('projects').size() > 0) {
            filtering();
        } else {
            // 清空缓存数据
            db('projects').remove({});
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
                            name: project.name,
                            description: description,
                            https_url: project.https_url,
                            is_public: project.is_public
                        });
                    });
                    filtering();
                }
            } catch(e) {
                // Not a valid JSON response
                workflow.addItem(new Item({
                  valid: true, icon: AlfredNode.ICONS.ERROR,
                  title: "错误：Not a valid JSON response",
                  arg: "https://github.com/lijy91/alfred-coding-workflow"
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
} finally {
    workflow.feedback();
}
