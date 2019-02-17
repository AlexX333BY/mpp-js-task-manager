const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const Task = require('..' + path.sep + path.join('scripts', 'task'));

const pageLocalization = { title: 'Task Manager', greeting: 'Welcome to Task Manager!', taskNameQuery: 'Name',
        taskAttachmentQuery: 'Attachment', taskCompleteDateQuery: 'Completion date',
        submitTaskButton: 'Submit task', nonCompletedTasks: 'Non-completed tasks', completedTasks: 'Completed tasks',
        taskListHeader: 'Tasks', addTaskHeader: 'Add new task' },
    taskLocalization  = { completeTaskButton: 'Complete', downloadAttachment: 'Download attachment',
        completedStatus: 'Completed', nonCompletedStatus: 'Not completed' };

router.get('/', (req, res) => res.send(fs.readFileSync(path.join('views', 'page.ejs')).toString()));

router.get('/index', (req, res) => res.send(JSON.stringify({ template: fs.readFileSync(path.join('views', 'index.ejs')).toString(),
    loc: pageLocalization })));

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
    updateStorage();
    res.end();
});

router.post('/completeTask', function (req, res) {
    tasks[parseInt(req.body['taskId'])].complete();
    updateStorage();
    res.end();
});

function isObjectEmpty(obj) {
    return (Object.entries(obj).length === 0) && (obj.constructor === Object);
}


module.exports = router;
