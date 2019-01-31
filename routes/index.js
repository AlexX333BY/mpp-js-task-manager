let express = require('express');
let router = express.Router();

router.get('/', function (req, res, next) {
    res.render('index', { title: 'Task Manager', greeting: 'Welcome to Task Manager', gotoTaskList: 'Show tasks',
        gotoAddTask: 'Add new task' });
});

module.exports = router;
