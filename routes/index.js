let express = require('express');
let router = express.Router();

class Task {
    /*name;
    completeDate;
    attachmentFileName;
    status;*/

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
}

let localization = { title: 'Task Manager', greeting: 'Welcome to Task Manager!', taskNameQuery: 'Name',
    taskAttachmentQuery: 'Attachment', taskCompleteDateQuery: 'Completion date',
    submitTaskButton: 'Submit task', nonCompletedTasks: 'Non-completed tasks', completedTasks: 'Completed tasks',
    filterTasks: 'Filter tasks', taskListHeader: 'Tasks', addTaskHeader: 'Add new task',
    completeTaskButton: 'Complete', downloadAttachment: 'Download attachment' };

let tasks = new Map();

router.get('/', function (req, res, next) {
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
});

function isObjectEmpty(obj) {
    return (Object.entries(obj).length === 0) && (obj.constructor === Object);
}

function createTaskEntry(task, taskId) {
    let taskEntry = { taskId: taskId, taskName: task.name, expectedCompleteDate: task.completeDate,
        taskStatus: task.status, taskAttachment: task.attachmentFileName,
        downloadAttachment: localization.downloadAttachment, completeTask: localization.completeTaskButton };

    if (task.isCompleted()) {
        taskEntry.completeTaskDisabled = 'disabled';
    } else {
        taskEntry.completeTaskDisabled = '';
    }

    if (task.attachmentFileName == null) {
        taskEntry.downloadAttachmentDisabled = 'disabled';
    } else {
        taskEntry.downloadAttachmentDisabled = '';
    }

    if (task.isExpired()) {
        taskEntry.taskStatusClass = 'expired-task-status';
    } else {
        taskEntry.taskStatusClass = 'task-status';
    }

    return taskEntry;
}

module.exports = router;
