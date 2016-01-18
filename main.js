#!/usr/bin/env node
const request = require('request');
const minimatch = require('minimatch');
const argv = require('minimist')(process.argv.slice(2));
const version = require('./package.json').version;

const low = require('lowdb');
const db = low('db.json');

const AlfredNode = require('alfred-workflow-nodejs');
const actionHandler = AlfredNode.actionHandler;
const workflow = AlfredNode.workflow;
const Item = AlfredNode.Item;


function error(title, subtitle, arg) {
    workflow.clearItems();
    var item = new Item({uid: "0", title: title, subtitle: subtitle, valid: true, icon: AlfredNode.ICONS.ERROR, arg: arg,  autocomplete: "autocomplete"});
    workflow.addItem(item);
    workflow.feedback();
}

var token = "";

// 判断版本更新

// 设置 Token
if (argv.t || argv.token) {
    // 通过参数设置 Token
    token = typeof (argv.t || argv.token) === 'string' ? (argv.t || argv.token).trim() : '';
} else {
    // 通过配置设置 Token
}

// 未设置 Token 错误提醒
if (token == "") {
    error("错误：无令牌，请按 Return 键查看配置说明", "https://github.com/lijy91/alfred-coding-workflow", "https://github.com/lijy91/alfred-coding-workflow");
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
        error("错误：搜索参数设置错误，请按 Return 键查看配置说明", "https://github.com/lijy91/alfred-coding-workflow", "https://github.com/lijy91/alfred-coding-workflow");
    } else {
        if (db('projects').size() > 0) {
            var projects = db('projects').value();
            projects.forEach(function(project) {
                if (queryReg.test(project.name)) {
                    var projectItem = new Item({
                        uid: project.id,
                        title: project.name,
                        subtitle: project.description,
                        valid: true, icon: AlfredNode.ICONS.WEB,
                        arg: project.https_url,
                        autocomplete: "autocomplete"}
                    );
                    workflow.addItem(projectItem);
                }
            });
            workflow.feedback();
        } else {
            request.get('https://coding.net/api/user/projects?page=1&pageSize=100&access_token=' + token, {
            }, function (error, response, body) {
                // 没有 response 数据，或者状态码不为 200
                if (response === undefined ||
                    response.statusCode !== 200) {
                    // TODO: 错误消息提醒
                } else {
                    try {
                        // 清空旧数据
                        db('projects').remove({});
                        workflow.clearItems();
                        var result = JSON.parse(body);
                        // 返回的状态码不为 0
                        if (result.code !== 0) {
                            console.log(result.code)
                            return;
                        }
                        result.data.list.forEach(function(project) {
                            db('projects').push({
                                id: project.id,
                                name: project.name,
                                description: project.description,
                                https_url: project.https_url,
                            });

                            if (queryReg.test(project.name)) {
                                var projectItem = new Item({
                                    uid: project.id,
                                    title: project.name,
                                    subtitle: project.description,
                                    valid: true, icon: AlfredNode.ICONS.WEB,
                                    arg: project.https_url,
                                    autocomplete: "autocomplete"}
                                );
                                workflow.addItem(projectItem);
                            }
                        });
                        workflow.feedback();
                    } catch(e) {
                        // Not a valid JSON response
                        console.log('Not a valid JSON response');
                    }
                }
            });
        }
    }
}

// https://coding.net/oauth_authorize.html?client_id=8611acd29258e165f3e15402eefa2cbd&redirect_uri=http://acw.coding.io&response_type=code&scope=project
// https://coding.net/api/oauth/access_token?client_id=8611acd29258e165f3e15402eefa2cbd&client_secret=47e1dbfec4f115443f8b988aa8ad496ef9888334&grant_type=authorization_code&code=561da76ea0406620072df3ea80e6207f
// {"access_token":"813450697ca34639a0cf8bb0f024dec2","refresh_token":"45e49152a22b4de49f887dd620446ec5","expires_in":"864000"}
