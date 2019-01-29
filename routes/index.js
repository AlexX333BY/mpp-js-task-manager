let express = require('express');
let router = express.Router();

router.get('/', function(req, res, next) {
    let tasks = [];

    res.render('index', { title: 'Task Manager', greeting: 'Welcome to Task Manager!', tasks: tasks });
});

module.exports = router;
