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

router.use(function (req, res, next) {
    if (req.path.includes('login') || isTokenValid(req.cookies[cookieName])) {
        next();
    } else {
        res.status(401).end();
    }
});

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
        createCookie(user);
        res.status(200).end();
    } else {
        const user = suchUsers[0];
        if (user.checkPassword(password)) {
            createCookie(user);
            res.status(200).end();
        } else {
            res.status(406).end();
        }
    }
});

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

        sendingTasks = tasks.filter((task) => filters.includes(task.isCompleted().toString()));
    }

    res.send(JSON.stringify({ tasks: sendingTasks,
        template: fs.readFileSync(path.join('views', 'task.ejs')).toString(), loc: taskLocalization }));
});

router.get('/downloadTaskAttachment', (req, res) => res.download(tasks[parseInt(req.query['taskId'])].attachmentFileName));

router.get('/favicon.ico', (req, res) => res.status(204).end());

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
        tasks.length, attachmentFileName));
    updateTasksStorage();
    res.end();
});

router.post('/completeTask', function (req, res) {
    tasks[parseInt(req.body['taskId'])].complete();
    updateTasksStorage();
    res.end();
});

function isObjectEmpty(obj) {
    return (Object.entries(obj).length === 0) && (obj.constructor === Object);
}

function isTokenValid(token) {
    try {
        const decoded = jwt.verify(token, privateKey),
            tokenUser = users.filter(decoded.username);
        if (tokenUser.length === 0) {
            return false;
        } else {
            return tokenUser.checkPassword(decoded.password);
        }
    } catch(err) {
        return false;
    }
}

function createCookie(res) {
    res.cookie(cookieName, createToken(user), { httpOnly: true, maxAge: tokenExpirationTime });
}

function createToken(user) {
    return jwt.sign(user, privateKey, { expiresIn: tokenExpirationTime });
}

module.exports = router;
