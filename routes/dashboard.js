var express = require('express');
var router = express.Router();
var db = require('../database/index.js');
var path = require('path');
// access to the database (model is defined in models

/* GET home page. */
router.get('/', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    var nbUsers = await db.models.Users.count();
    var nbDevices = await db.models.Devices.count();
    var devices = await db.models.Devices.findAll();
    var latestImages = await db.models.Images.findAll({
        limit: 5,
        order: [
            ['createdAt', 'DESC']
        ]
    });
    var nbImages = await db.models.Images.count();


    res.render('dashboard_index', { nbUsers: nbUsers, nbDevices: nbDevices, nbImages: nbImages, user, devices: devices, latestImages: latestImages });
});

router.get('/add', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    res.render('dashboard_add', { user });
});
router.post('/add', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    let randomkey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    var device = await db.models.Devices.create({
        name: req.body.name,
        userId: user.id,
        status: "actif",
        key: randomkey
    });
    res.redirect('/dashboard/devices/' + device.id);
});

router.get('/devices/:id', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    var device = await db.models.Devices.findOne({
        where: {
            id: req.params.id
        }
    });
    if (!device) {
        res.redirect('/dashboard');
        next();
    }
    var images = await db.models.Images.findAll({
        where: {
            deviceId: device.id
        }
    });
    res.render('dashboard_device', { user, device: device, images: images });
});
router.get('/devices/:id/script/:type', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user && (!req.query.key || req.query.key == undefined)) {
        res.redirect('/users/login');
        next();
    }
    var device = await db.models.Devices.findOne({
        where: {
            id: req.params.id,
            key: req.query.key
        }
    });
    if (!device) {
        res.redirect('/dashboard');
        next();
    }

    if (req.params.type == "bash") {
        var code = require("../scripts/linux.js")("http://localhost:3000/", device.key);
        res.send(code);
    }
})
router.get('/image/:id', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    var image = await db.models.Images.findOne({
        where: {
            id: req.params.id,
            userId: user.id
        }
    });
    if (!image) {
        res.sendStatus(404);
    }
    console.log(image)
    
    res.sendFile(path.join(__dirname, '../images/' + image.url));

})
router.get('/image/:id/delete', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    var image = await db.models.Images.destroy({
        where: {
            id: req.params.id,
            userId: user.id
        }
    });
    
})

module.exports = router;