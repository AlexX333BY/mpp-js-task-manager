let express = require('express');
let router = express.Router();

router.get('/', function (req, res, next) {
    res.render('add', { title: 'Task Manager', greeting: 'Welcome to Task Manager', gotoTaskList: 'Show tasks',
        taskName: 'New task name', taskAttachment: 'New task attachment',
        taskCompleteDate: 'Task expected complete date' });
});

module.exports = router;
