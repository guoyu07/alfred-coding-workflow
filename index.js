#!/usr/bin/env node

var request = require('request');
var minimatch = require('minimatch');
var AlfredItem = require("alfred-item");
var argv = require('minimist')(process.argv.slice(2));
var version = require('./package.json').version;

// https://coding.net/oauth_authorize.html?client_id=8611acd29258e165f3e15402eefa2cbd&redirect_uri=https://github.com/lijy91/alfred-coding-workflow&response_type=code&scope=project
// https://coding.net/api/oauth/access_token?client_id=8611acd29258e165f3e15402eefa2cbd&client_secret=47e1dbfec4f115443f8b988aa8ad496ef9888334&grant_type=authorization_code&code=561da76ea0406620072df3ea80e6207f
// {"access_token":"813450697ca34639a0cf8bb0f024dec2","refresh_token":"45e49152a22b4de49f887dd620446ec5","expires_in":"864000"}

var ACCESS_TOKEN = "813450697ca34639a0cf8bb0f024dec2";

if (argv.v || argv.version) {
    // console.log('v' + version);
} else if (argv.h || argv.help) {
    // 显示帮助
} else {
    // console.log('alfred-coding-workflow');
    // console.log('v' + version + '\n');

    // 获取关键字参数
    var query = '';
    var queryReg;
    if (argv.q || argv.query) {
        query = typeof (argv.q || argv.query) === 'string' ? (argv.q || argv.query).trim() : '';
        queryReg = new RegExp('[' + query + ']+', 'i')
        // console.log(query);
    } else {

    }
    if (query.length === 0) {
        // console.log("请输入关键字");
    } else {
        request.get('https://coding.net/api/user/projects?page=1&pageSize=100&access_token=' + ACCESS_TOKEN, {

        }, function (error, response, body) {
            try {
                body = JSON.parse(body);
            } catch(e) {
                // console.log('Not a valid JSON response');
            }

            if (response === undefined) {

            } else if (response.statusCode !== 200) {

            } else if (body.code !== 0) {

            } else {
                var item = new AlfredItem();
                var data = body.data;
                data.list.forEach(function(project) {
                    if (queryReg.test(project.name)) {
                        item.addItem(project.id,
                          project.name,
                          project.description,
                          project.icon,
                          {
                              https_url: project.https_url
                          }
                        );
                    } else {
                        try {
                            item.delItemViaUid(project.id);
                        } catch (e) { }
                    }
                });
                var xml = item.output();
                console.log(xml);
                console.log(item);
            }
        });
    }
}
