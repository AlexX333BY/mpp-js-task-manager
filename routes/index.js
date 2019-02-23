const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.get('/favicon.ico', (req, res) => res.status(204).end());

router.get('/', (req, res) => res.send(fs.readFileSync(path.join('views', 'page.ejs')).toString()));

module.exports = router;
