var express = require('express');
var router = express.Router();
var db = require('../database/index.js');
// access to the database (model is defined in models

/* GET home page. */
router.get('/', async function (req, res, next) {
    var nbUsers = await db.models.Users.count();
    var nbDevices = await db.models.Devices.count();
    var nbImages = await db.models.Images.count();
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }

    res.render('dashboard_index', { nbUsers: nbUsers, nbDevices: nbDevices, nbImages: nbImages, user });
});

module.exports = router;