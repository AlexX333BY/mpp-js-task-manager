let express = require('express');
let router = express.Router();
let path = require('path');
let fs = require('fs');
let Task = require('..' + path.sep + 'task');
let taskSerializer = require('..' + path.sep + 'task-serializer');

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
        tasks.forEach((value, index) => renderTasks.push(createTaskEntry(value, index)));
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
            for (let index = 0; index < tasks.length; ++index) {
                if (tasks[index].status === status) {
                    renderTasks.push(createTaskEntry(tasks[index], index));
                }
            }
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
    tasks[parseInt(req.body['taskId'])].complete();
    renderIndex(req, res);
}

function addTask(req, res) {
    let attachmentFileName = null,
        attachment = req.files['taskAttachment'],
        newTaskId = tasks.length;

    if (attachment != undefined) {
        let attachmentPath = attachmentsDirectory + newTaskId + path.sep;
        if (!fs.existsSync(attachmentPath)){
            fs.mkdirSync(attachmentPath);
        }

        attachmentFileName = attachmentPath + attachment.name;
        attachment.mv(attachmentFileName);
    }

    tasks[newTaskId] = new Task(req.body['taskName'], new Date(req.body['expectedCompleteDate']), attachmentFileName);
    fs.writeFileSync(tasksPath, taskSerializer.serializeTaskArray(tasks));
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
