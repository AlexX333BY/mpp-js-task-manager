const path = require('path');
const fs = require('fs');
const express = require('express');
const ejs = require('ejs');
const router = express.Router();
const Task = require('..' + path.sep + path.join('scripts', 'task'));

const localization = { title: 'Task Manager', greeting: 'Welcome to Task Manager!', taskNameQuery: 'Name',
    taskAttachmentQuery: 'Attachment', taskCompleteDateQuery: 'Completion date',
    submitTaskButton: 'Submit task', nonCompletedTasks: 'Non-completed tasks', completedTasks: 'Completed tasks',
    filterTasks: 'Filter tasks', taskListHeader: 'Tasks', addTaskHeader: 'Add new task',
    completeTaskButton: 'Complete', downloadAttachment: 'Download attachment',
    completedStatus: 'Completed', nonCompletedStatus: 'Not completed' };

router.get('/', function (req, res) {
    res.render('index', { title: localization.title, greeting: localization.greeting,
        taskName: localization.taskNameQuery, taskAttachment: localization.taskAttachmentQuery,
        taskCompleteDate: localization.taskCompleteDateQuery, submitNewTask: localization.submitTaskButton,
        nonCompletedTasks: localization.nonCompletedTasks, completedTasks: localization.completedTasks,
        filterTasks: localization.filterTasks, taskListHeader: localization.taskListHeader,
        addTaskHeader: localization.addTaskHeader });
});

router.get('/tasks', function (req, res) {
    const sendingTasks = [];

    if (!isObjectEmpty(req.query)) {
        const statuses = req.query['isCompleted'];
        let filters;

        if (Array.isArray(statuses)) {
            filters = statuses;
        } else {
            filters = [];
            filters.push(statuses);
        }

        let filteredTasks = tasks.filter((task) => filters.includes(task.isCompleted().toString()));
        for (let index = 0; index < filteredTasks.length; ++index) {
            sendingTasks.push(createTaskEntry(filteredTasks[index], index))
        }
    }

    res.send(JSON.stringify(sendingTasks));
});

router.get('/downloadTaskAttachment', function (req, res) {
    res.download(tasks[parseInt(req.query['taskId'])].attachmentFileName);
});

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

    tasks[newTaskId] = new Task(req.body['newTaskName'], new Date(req.body['newTaskExpectedCompleteDate']),
        attachmentFileName);
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

function createTaskEntry(task, taskId) {
    const taskEntry = { taskId: taskId, taskName: task.name, taskAttachment: task.attachmentFileName,
        downloadAttachment: localization.downloadAttachment, completeTask: localization.completeTaskButton };

    taskEntry.expectedCompleteDate = task.completeDate.getDate() + '.' + (task.completeDate.getMonth() + 1) + '.'
        + task.completeDate.getFullYear();

    if (task.isCompleted()) {
        taskEntry.taskStatus = localization.completedStatus;
        taskEntry.completeTaskDisabled = 'disabled';
    } else {
        taskEntry.taskStatus = localization.nonCompletedStatus;
        taskEntry.completeTaskDisabled = '';
    }

    if (task.attachmentFileName == null) {
        taskEntry.downloadAttachmentDisabled = 'disabled';
    } else {
        taskEntry.downloadAttachmentDisabled = '';
    }

    if (task.isExpired()) {
        taskEntry.taskEntryClass = 'expired-task-entry';
    } else {
        taskEntry.taskEntryClass = 'task-entry';
    }

    return ejs.render(fs.readFileSync(path.join('views', 'task.ejs')).toString(), taskEntry);
}

module.exports = router;
