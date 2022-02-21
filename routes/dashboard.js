var express = require('express');
var router = express.Router();
var db = require('../database/index.js');
var path = require('path');
var fs = require('fs');
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
        },
        order: [
            ['createdAt', 'DESC']
        ]
    });
    var timelapses = await db.models.Timelapses.findAll({
        where: {
            userId: user.id,
            deviceId: device.id
        },

        order: [
            ['createdAt', 'DESC']
        ]
    });

    res.render('dashboard_device', { user, device: device, images: images, timelapses: timelapses });
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
router.post("/devices/:id/edit", async function (req, res, next) {
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
    if (req.body.name) {
        device.name = req.body.name;
    }
    if (req.body.intervalS) {
        if (req.body.intervalS >= 5) {
            device.intervalMs = req.body.intervalS * 1000;
        }
    }
    device.save();
    res.redirect('/dashboard/devices/' + device.id);
});
router.post("/devices/:id/createtimelaps", async function (req, res, next) {
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
            deviceId: device.id,
            userId: user.id
        }
    });
    framerate = req.body.framerate;
    if (framerate < 1) {
        framerate = 1;
    }
    if (images.length == 0) {
        res.redirect('/dashboard/devices/' + device.id);
        next();
    }
    // delete all timelapses for this device
    await db.models.Timelapses.findAll({
        where: {
            deviceId: device.id,
            userId: user.id
        }
    }).then(async function (timelapses) {
        for (var i = 0; i < timelapses.length; i++) {
            fs.unlink(path.join(__dirname, '../timelapses/output/' + timelapses[i].url), function (err) {
                if (err) {
                    console.log(err);
                }
            });
            await timelapses[i].destroy();
        }
    });


    require("../timelaps/generator.js")(images, framerate, user.id, device.id)
    res.redirect('/dashboard/devices/' + device.id);
});

router.get('/timelaps/:tid', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    var timeLaps = await db.models.Timelapses.findOne({
        where: {
            id: req.params.tid,
            userId: user.id,
        }
    });
    if (!timeLaps) {
        res.redirect('/dashboard/devices/' + req.params.id);
        next();
    }
    // send mp4
    res.header('Content-Type', 'video/mp4'); 
    res.sendFile(path.join(__dirname, '../timelaps/output/' + timeLaps.url));
});


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