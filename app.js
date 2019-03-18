'use strict';
// 引入模块
const express = require('express'),
	SocketServer = require('./websocket/index.js'),
	path = require('path');

// 引入路由
const indexRouter = require('./routes/index');

// 引入中间件
const cookieParser = require('cookie-parser'),
	createError = require('http-errors'),
	errHandler = require('errorhandler'),
	logger = require('morgan'),
	favicon = require('serve-favicon');

// 创建express并进行配置
const app = express();
app.locals.appTitle = "无题";
app.locals.SocketServer = SocketServer;

// 设置视图引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 如果为开发环境，使用标准Express.js 4错误处理器
if ('development' === app.get('env')) {
	app.use(errHandler());
}

// 使用中间件
app.use(favicon(path.join(__dirname, 'public', 'favicon.jpg')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
if (app.get('env') === 'development') {
	app.use(express.static(path.join(__dirname, 'public')));
}
else {
	app.use(express.static(path.join(__dirname, 'dist')));
}

// 使用路由
app.use('/', indexRouter);

// 捕获404错误送到错误处理程序
app.use(function (req, res, next) {
	next(createError(404));
});

// 错误处理程序
app.use(function (err, req, res, next) {
	// 设置局部变量，只在开发环境中提供错误
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// 渲染出错页面
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
