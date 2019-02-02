let express = require('express');
let router = express.Router();

let tasks = [];
let localization = { title: 'Task Manager', greeting: 'Welcome to Task Manager!', taskNameQuery: 'Type task name',
    taskAttachmentQuery: 'Add task attachment', taskCompleteDateQuery: 'Enter task completion date',
    submitTaskButton: 'Submit task', nonCompletedTasks: 'Non-completed tasks', completedTasks: 'Completed tasks',
    filterTasks: 'Filter tasks' };

router.get('/', function (req, res, next) {
    res.render('index', { tasks: tasks, title: localization.title, greeting: localization.greeting,
        taskName: localization.taskNameQuery, taskAttachment: localization.taskAttachmentQuery,
        taskCompleteDate: localization.taskCompleteDateQuery, submitNewTask: localization.submitTaskButton,
        nonCompletedTasks: localization.nonCompletedTasks, completedTasks: localization.completedTasks,
        filterTasks: localization.filterTasks });
});

module.exports = router;
