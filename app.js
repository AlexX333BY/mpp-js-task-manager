const path = require('path');
const fs = require('fs');
const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload');
const taskSerializer = require('.' + path.sep + path.join('scripts', 'task-serializer'));
const userSerializer = require('.' + path.sep + path.join('scripts', 'user-serializer'));
const secureRandom = require('secure-random');

const indexRouter = require('.' + path.sep + path.join('routes', 'index'));

const app = express();

function initStorage() {
    global.tasksDirectory = '.' + path.sep + 'tasks' + path.sep;
    global.tasksPath = path.join(tasksDirectory, 'tasks.dat');
    global.attachmentsDirectory = path.join(tasksDirectory, 'attachments') + path.sep;
    global.usersPath = '.' + path.sep + path.join('users', 'users.dat');

    global.updateTasksStorage = function() {
        fs.writeFileSync(tasksPath, taskSerializer.serializeTaskArray(tasks));
    };

    global.updateUsersStorage = function () {
        fs.writeFileSync(usersPath, userSerializer.serializeUserArray(users));
    };

    if (!fs.existsSync(tasksDirectory)) {
        fs.mkdirSync(tasksDirectory);
    }

    if (!fs.existsSync(attachmentsDirectory)) {
        fs.mkdirSync(attachmentsDirectory);
    }

    if (fs.existsSync(tasksPath)) {
        global.tasks = taskSerializer.deserializeTaskArray(fs.readFileSync(tasksPath));
    } else {
        global.tasks = [];
    }

    if (!fs.existsSync(path.dirname(usersPath))) {
        fs.mkdirSync(path.dirname(usersPath));
    }

    if (fs.existsSync(usersPath)) {
        global.users = userSerializer.deserializeUserArray(fs.readFileSync(usersPath));
    } else {
        global.users = [];
    }

    updateTasksStorage();
    updateUsersStorage();

    const keyPath = 'private.key';
    if (fs.existsSync(keyPath)) {
        global.privateKey = fs.readFileSync(keyPath);
    } else {
        global.privateKey = secureRandom(256, { type: 'Buffer' }).toString('hex');
        fs.writeFileSync(keyPath, privateKey);
    }
    global.cookieName = 'token';
    global.tokenExpirationTime = 60 * 60 * 1000;
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(fileUpload());
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

initStorage();

module.exports = app;
