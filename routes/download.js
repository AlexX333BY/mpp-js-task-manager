let express = require('express');
let router = express.Router();

router.get('/', function (req, res, next) {
    res.download(tasks.get(parseInt(req.query['taskId'])).attachmentFileName);
});

module.exports = router;
