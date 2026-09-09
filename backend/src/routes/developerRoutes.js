const express = require('express');
const router = express.Router();
const { getDeveloperProfile, getDeveloperApps } = require('../controllers/developerController');

router.get('/:id', getDeveloperProfile);
router.get('/:id/apps', getDeveloperApps);

module.exports = router;
