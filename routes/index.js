const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const Task = require('..' + path.sep + path.join('scripts', 'task'));
const User = require('..' + path.sep + path.join('scripts', 'user'));
const jwt = require('jsonwebtoken');

const commonLocalization = { title: 'Task Manager', greeting: 'Welcome to Task Manager!' },
    pageLocalization = { title: commonLocalization.title, greeting: commonLocalization.greeting, taskNameQuery: 'Name',
        taskAttachmentQuery: 'Attachment', taskCompleteDateQuery: 'Completion date',
        submitTaskButton: 'Submit task', nonCompletedTasks: 'Non-completed tasks', completedTasks: 'Completed tasks',
        taskListHeader: 'Tasks', addTaskHeader: 'Add new task' },
    taskLocalization  = { completeTaskButton: 'Complete', downloadAttachment: 'Download attachment',
        completedStatus: 'Completed', nonCompletedStatus: 'Not completed' },
    loginLocalization = { title: commonLocalization.title, greeting: commonLocalization.greeting, loginHeader: 'Login',
        usernameQuery: 'Username', passwordQuery: 'Password', submitLoginButton: 'Login' };

router.get('/favicon.ico', (req, res) => res.status(204).end());

router.use(function (req, res, next) {
    if (req.url.includes('login') || (req.url === '/') || isTokenValid(getTokenFromRequest(req))) {
        next();
    } else {
        res.status(401).end();
    }
});

function isTokenValid(token) {
    try {
        const decoded = decodeUserFromToken(token),
            tokenUser = users.filter((user) => user.username === decoded.username);
        if (tokenUser.length === 0) {
            return false;
        } else {
            return tokenUser[0].passwordHash === decoded.passwordHash;
        }
    } catch(err) {
        return false;
    }
}

function decodeUserFromToken(token) {
    return jwt.verify(token, privateKey);
}

function getTokenFromRequest(req) {
    return req.cookies[cookieName];
}

router.get('/', (req, res) => res.send(fs.readFileSync(path.join('views', 'page.ejs')).toString()));

router.get('/index', (req, res) => res.send(JSON.stringify({ template: fs.readFileSync(path.join('views', 'index.ejs')).toString(),
    loc: pageLocalization })));

router.get('/login', (req, res) => res.send(JSON.stringify({ template: fs.readFileSync(path.join('views', 'login.ejs')).toString(),
    loc: loginLocalization })));

router.post('/login', function (req, res) {
    const username = req.body['username'],
        password = req.body['password'];

    const suchUsers = users.filter((user) => user.username === username);
    if (suchUsers.length === 0) {
        const user = new User(username, users.length, password);
        users.push(user);
        updateUsersStorage();
        createCookie(res, user);
        res.status(200).end();
    } else {
        const user = suchUsers[0];
        if (user.checkPassword(password)) {
            createCookie(res, user);
            res.status(200).end();
        } else {
            res.status(406).end();
        }
    }
});

function createCookie(res, user) {
    res.cookie(cookieName, createToken(user), { httpOnly: true, maxAge: tokenExpirationTime });
}

function createToken(user) {
    return jwt.sign(JSON.parse(JSON.stringify(user)), privateKey, { expiresIn: tokenExpirationTime });
}

router.get('/tasks', function (req, res) {
    let sendingTasks = [];

    if (!isObjectEmpty(req.query)) {
        const statuses = req.query['isCompleted'];
        let filters;

        if (Array.isArray(statuses)) {
            filters = statuses;
        } else {
            filters = [];
            filters.push(statuses);
        }

        const userId = decodeUserFromToken(getTokenFromRequest(req)).id;
        sendingTasks = tasks.filter((task) => (task.authorId == userId) && filters.includes(task.isCompleted().toString()));
    }

    res.send(JSON.stringify({ tasks: sendingTasks,
        template: fs.readFileSync(path.join('views', 'task.ejs')).toString(), loc: taskLocalization }));
});

router.get('/downloadTaskAttachment', function (req, res) {
    const userId = decodeUserFromToken(getTokenFromRequest(req)).id,
        task = tasks[parseInt(req.query['taskId'])];
    if (task.authorId == userId) {
        res.download(task.attachmentFileName);
    } else {
        res.status(403).end();
    }
});

router.post('/completeTask', function (req, res) {
    const userId = decodeUserFromToken(getTokenFromRequest(req)).id,
        task = tasks[parseInt(req.body['taskId'])];
    if (task.authorId == userId) {
        task.complete();
        updateTasksStorage();
        res.end();
    } else {
        res.status(403).end();
    }
});

router.post('/addTask', function (req, res) {
    let attachmentFileName = null;
    const attachment = req.files['newTaskAttachment'],
        newTaskId = tasks.length;

    if (attachment !== undefined) {
        const attachmentPath = attachmentsDirectory + newTaskId + path.sep;
        if (!fs.existsSync(attachmentPath)){
            fs.mkdirSync(attachmentPath);
        }

        attachmentFileName = attachmentPath + attachment.name;
        attachment.mv(attachmentFileName);
    }

    tasks.push(new Task(req.body['newTaskName'], new Date(req.body['newTaskExpectedCompleteDate']),
        tasks.length, decodeUserFromToken(getTokenFromRequest(req)).id, attachmentFileName));
    updateTasksStorage();
    res.end();
});

function isObjectEmpty(obj) {
    return (Object.entries(obj).length === 0) && (obj.constructor === Object);
}

module.exports = router;
