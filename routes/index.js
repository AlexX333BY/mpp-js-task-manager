let express = require('express');
let router = express.Router();

function renderTasks(req, res, next) {
    let tasks = [];

    res.render('index', { title: 'Task Manager', greeting: 'Welcome to Task Manager!', tasks: tasks,
        add_task_button: 'Add task' });
}

router.get('/', renderTasks);

router.post('/', function(req, res, next) {
    // TODO: update some data
    renderTasks(req, res, next);
});

module.exports = router;
