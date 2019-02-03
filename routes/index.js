let express = require('express');
let router = express.Router();
let path = require('path');
let fs = require('fs');

const attachmentsPath = './attachments/';
if (!fs.existsSync(attachmentsPath)){
    fs.mkdirSync(attachmentsPath);
}

class Task {
    constructor(name, completeDate, attachmentFileName = null) {
        this.attachmentFileName = attachmentFileName;
        this.completeDate = completeDate;
        this.name = name;
        this.status = 'nonCompleted';
    }

    isCompleted() {
        return this.status === 'completed';
    }

    isExpired() {
        return (!this.isCompleted() && (this.completeDate < new Date()));
    }
    
    complete() {
        this.status = 'completed';
    }
}

let localization = { title: 'Task Manager', greeting: 'Welcome to Task Manager!', taskNameQuery: 'Name',
    taskAttachmentQuery: 'Attachment', taskCompleteDateQuery: 'Completion date',
    submitTaskButton: 'Submit task', nonCompletedTasks: 'Non-completed tasks', completedTasks: 'Completed tasks',
    filterTasks: 'Filter tasks', taskListHeader: 'Tasks', addTaskHeader: 'Add new task',
    completeTaskButton: 'Complete', downloadAttachment: 'Download attachment',
    completedStatus: 'Completed', nonCompletedStatus: 'Not completed' };

router.get('/', renderIndex);

router.post('/', function (req, res) {
    if (req.body['taskId'] === undefined) {
        addTask(req, res);
    } else {
        completeTask(req, res);
    }
});

function renderIndex(req, res) {
    let renderTasks = [];

    if (isObjectEmpty(req.query)) {
        tasks.forEach((value, key, map) => renderTasks.push(createTaskEntry(value, key)));
    } else {
        let statuses = req.query['taskStatus'],
            filters;

        if (Array.isArray(statuses)) {
            filters = statuses;
        } else {
            filters = [];
            filters.push(statuses);
        }

        filters.forEach(function (status) {
            tasks.forEach(function (value, key, map) {
                if (value.status === status) {
                    renderTasks.push(createTaskEntry(value, key));
                }
            })
        });
    }

    res.render('index', { tasks: renderTasks, title: localization.title, greeting: localization.greeting,
        taskName: localization.taskNameQuery, taskAttachment: localization.taskAttachmentQuery,
        taskCompleteDate: localization.taskCompleteDateQuery, submitNewTask: localization.submitTaskButton,
        nonCompletedTasks: localization.nonCompletedTasks, completedTasks: localization.completedTasks,
        filterTasks: localization.filterTasks, taskListHeader: localization.taskListHeader,
        addTaskHeader: localization.addTaskHeader });
}

function completeTask(req, res) {
    tasks.get(parseInt(req.body['taskId'])).complete();
    renderIndex(req, res);
}

function addTask(req, res) {
    let attachmentFileName = null,
        attachment = req.files['taskAttachment'],
        newTaskId = tasks.size;

    if (attachment.name) {
        let attachmentPath = attachmentsPath + newTaskId + path.sep;
        if (!fs.existsSync(attachmentPath)){
            fs.mkdirSync(attachmentPath);
        }

        attachmentFileName = attachmentPath + attachment.name;
        attachment.mv(attachmentFileName);
    }

    tasks.set(newTaskId, new Task(req.body['taskName'], new Date(req.body['expectedCompleteDate']), attachmentFileName));
    renderIndex(req, res);
}

function isObjectEmpty(obj) {
    return (Object.entries(obj).length === 0) && (obj.constructor === Object);
}

function createTaskEntry(task, taskId) {
    let taskEntry = { taskId: taskId, taskName: task.name, taskAttachment: task.attachmentFileName,
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

    return taskEntry;
}

module.exports = router;
