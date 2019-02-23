const path = require('path');
const fs = require('fs');
const Task = require('.' + path.sep + path.join('scripts', 'task'));
const User = require('.' + path.sep + path.join('scripts', 'user'));
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

function sendIndexPage(socket) {
    socket.emit('index-page', fs.readFileSync(path.join('views', 'index.ejs')).toString(), pageLocalization);
}

function sendLoginPage(socket) {
    socket.emit('login-page', fs.readFileSync(path.join('views', 'login.ejs')).toString(), loginLocalization);
}

function sendTasks(socket, completionFilters, userId) {
    const sendingTasks = tasks.filter((task) => (task.authorId == userId) && completionFilters.includes(task.isCompleted().toString()));
    socket.emit('tasks', sendingTasks, fs.readFileSync(path.join('views', 'task.ejs')).toString(), taskLocalization);
}

function getSocketToken(socket) {
    return socket.request.headers.cookie;
}

function setSocketToken(socket, token) {
    socket.request.headers.cookie = token;
}

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

function createToken(user) {
    return jwt.sign(JSON.parse(JSON.stringify(user)), privateKey, { expiresIn: tokenExpirationTime });
}

function initializer(httpServer) {
    const io = require('socket.io')(httpServer);

    io.on('connection', function(socket){
        console.log(new Date() + ': socket connected');

        socket.use(function (packet, next) {
            if (packet[0].includes('login') || isTokenValid(getSocketToken(socket))) {
                next();
            } else {
                sendLoginPage(socket);
            }
        });

        socket.on('index-page', function () {
            sendIndexPage(socket);
        });

        socket.on('login-page', function () {
            sendLoginPage(socket);
        });

        socket.on('login', function (username, password, errorCallback) {
            const suchUsers = users.filter((user) => user.username === username);
            if (suchUsers.length === 0) {
                const user = new User(username, users.length, password);
                users.push(user);
                updateUsersStorage();
                setSocketToken(socket, createToken(user));
                errorCallback(200);
            } else {
                const user = suchUsers[0];
                if (user.checkPassword(password)) {
                    setSocketToken(socket, createToken(user));
                    errorCallback(200);
                } else {
                    errorCallback(406);
                }
            }
        });

        socket.on('tasks', function (filters) {
            sendTasks(socket, filters, decodeUserFromToken(getSocketToken(socket)).id);
        });

        socket.on('add-task', function (name, date, file, filename, errorCallback) {
            const newTaskId = tasks.length;
            let attachmentFileName = null;

            if (file != null) {
                const attachmentPath = attachmentsDirectory + newTaskId + path.sep;
                if (!fs.existsSync(attachmentPath)){
                    fs.mkdirSync(attachmentPath);
                }

                attachmentFileName = attachmentPath + filename;
                fs.writeFileSync(attachmentFileName, file);
            }

            tasks.push(new Task(name, date, newTaskId, decodeUserFromToken(getSocketToken(socket)).id, attachmentFileName));
            updateTasksStorage();
            errorCallback(200);
        });

        socket.on('complete-task', function (taskId, errorCodeCallback) {
            const userId = decodeUserFromToken(getSocketToken(socket)).id,
                task = tasks.filter((task) => (task.id === taskId) && (task.authorId === userId));
            if (task.length > 0) {
                task[0].complete();
                updateTasksStorage();
                errorCodeCallback(200);
            } else {
                errorCodeCallback(403);
            }
        });
        
        socket.on('download-attachment', function (taskId, fileCallback) {
            const userId = decodeUserFromToken(getSocketToken(socket)).id,
                task = tasks[taskId];
            if (task.authorId == userId) {
                fs.readFile(task.attachmentFileName, function (err, data) {
                    fileCallback(200, data, task.attachmentFileName);
                });
            } else {
                fileCallback(403, null);
            }
        });

        socket.on('disconnect', function () {
            console.log(new Date() + ': socket disconnected');
        })
    });

    return io;
}

module.exports = initializer;
