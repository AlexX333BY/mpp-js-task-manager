const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const Task = require('..' + path.sep + 'task');

const localization = { title: 'Task Manager', greeting: 'Welcome to Task Manager!', taskNameQuery: 'Name',
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
    updateStorage();
});

function renderIndex(req, res) {
    const renderTasks = [];

    if (isObjectEmpty(req.query)) {
        tasks.forEach((value, index) => renderTasks.push(createTaskEntry(value, index)));
    } else {
        const statuses = req.query['taskStatus'];
        let filters;

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
    let attachmentFileName = null;
    const attachment = req.files['taskAttachment'],
        newTaskId = tasks.length;

    if (attachment !== undefined) {
        const attachmentPath = attachmentsDirectory + newTaskId + path.sep;
        if (!fs.existsSync(attachmentPath)){
            fs.mkdirSync(attachmentPath);
        }

        attachmentFileName = attachmentPath + attachment.name;
        attachment.mv(attachmentFileName);
    }

    tasks[newTaskId] = new Task(req.body['taskName'], new Date(req.body['expectedCompleteDate']), attachmentFileName);
    renderIndex(req, res);
}

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

    return taskEntry;
}

module.exports = router;
