let express = require('express');
let router = express.Router();

let localization = { title: 'Task Manager', greeting: 'Welcome to Task Manager!', taskNameQuery: 'Name',
    taskAttachmentQuery: 'Attachment', taskCompleteDateQuery: 'Completion date',
    submitTaskButton: 'Submit task', nonCompletedTasks: 'Non-completed tasks', completedTasks: 'Completed tasks',
    filterTasks: 'Filter tasks', taskListHeader: 'Tasks', addTaskHeader: 'Add new task',
    completeTaskButton: 'Complete', downloadAttachment: 'Download attachment' };

let tasks = [];

router.get('/', function (req, res, next) {
    res.render('index', { tasks: tasks, title: localization.title, greeting: localization.greeting,
        taskName: localization.taskNameQuery, taskAttachment: localization.taskAttachmentQuery,
        taskCompleteDate: localization.taskCompleteDateQuery, submitNewTask: localization.submitTaskButton,
        nonCompletedTasks: localization.nonCompletedTasks, completedTasks: localization.completedTasks,
        filterTasks: localization.filterTasks, taskListHeader: localization.taskListHeader,
        addTaskHeader: localization.addTaskHeader });
});

module.exports = router;
