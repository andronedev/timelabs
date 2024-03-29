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
    var nbDevices = await db.models.Devices.count({
        where: {
            userId: user.id
        }
    });
    var devices = await db.models.Devices.findAll({
        where: {
            userId: user.id
        }
    });
    var latestImages = await db.models.Images.findAll({
        where: {
            userId: user.id
        },
        limit: 5,
        order: [
            ['createdAt', 'DESC']
        ]
    });
    var nbImages = await db.models.Images.count({
        where: {
            userId: user.id
        }
    });

    res.render('dashboard_index', { nbDevices: nbDevices, nbImages: nbImages, user, devices: devices, latestImages: latestImages });
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
    var timelapses = await db.models.Timelapses.findAll({
        where: {
            userId: user.id,
            deviceId: device.id
        },
        order: [
            ['createdAt', 'DESC']
        ],
    });
    var images = await db.models.Images.findAll({
        where: {
            userId: user.id,
            deviceId: device.id
        },
        order: [
            ['createdAt', 'DESC']
        ],
        limit: 5
    });
    var nbImages = await db.models.Images.count({
        where: {
            userId: user.id,
            deviceId: device.id
        }
    });

    res.render('dashboard_device', { user, device: device, timelapses: timelapses, images, nbImages, host: req.app.get('host') });
});
router.get('/devices/:id/images/:page?', async function (req, res, next) {
    req.params.page = parseInt(req.params.page) || 1;
    if (req.params.page < 1) {
        req.params.page = 1;
    }
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
            userId: user.id,
            deviceId: device.id
        },
        order: [
            ['createdAt', 'DESC']
        ],
        offset: (req.params.page - 1) * 10,
        limit: 10
    });
    var nbImages = await db.models.Images.count({
        where: {
            userId: user.id,
            deviceId: device.id
        }
    });
    var pagination = []
    pagination.push({
        page: 1,
        active: req.params.page == 1,
        url: '/dashboard/devices/' + device.id + '/images/1',
        ellipsis: false
    })
    pagination.push({
        page: -1,
        active: false,
        url: '',
        ellipsis: true
    })
    for (var i = req.params.page - 3; i <= req.params.page + 3; i++) {
        if (i == 1 || i == Math.ceil(nbImages / 10)) continue;
        if (i == req.params.page) {
            pagination.push({
                page: i,
                active: true,
                url: '/dashboard/devices/' + device.id + '/images/' + i,
                ellipsis: false

            });
        } else if (i > 0 && i <= Math.ceil(nbImages / 10)) {
            pagination.push({
                page: i,
                active: false,
                url: '/dashboard/devices/' + device.id + '/images/' + i,
                ellipsis: false
            });
        }
    }
    pagination.push({
        page: -1,
        active: false,
        url: '',
        ellipsis: true
    })
    pagination.push({
        page: Math.ceil(nbImages / 10),
        active: req.params.page == Math.ceil(nbImages / 10),
        url: '/dashboard/devices/' + device.id + '/images/' + Math.ceil(nbImages / 10),
        ellipsis: false
    })
    var nextPage = req.params.page + 1;
    if (nextPage > Math.ceil(nbImages / 10)) {
        nextPage = false
    }
    var previousPage = req.params.page - 1;
    if (previousPage < 1) {
        previousPage = false
    }
    var nextPageUrl = nextPage ? '/dashboard/devices/' + device.id + '/images/' + nextPage : false;
    var previousPageUrl = previousPage ? '/dashboard/devices/' + device.id + '/images/' + previousPage : false;
    res.render('dashboard_device_images', { user, device: device, images: images, pagination, page: req.params.page, nextPage, previousPage, nextPageUrl, previousPageUrl });
});
router.get('/devices/:id/script/:type/:clef?', async function (req, res, next) {
    // check key param

    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
   
    if (!user && !req.params.clef) {
        res.redirect('/users/login');
        next();
    }
    wherekey = {
        key: req.params.clef
    }
    if (!req.params.clef) {
        wherekey = {
            id: req.params.id
        }
    }
    var device = await db.models.Devices.findOne({
        where: wherekey
    });
    if (!device) {
        res.redirect('/dashboard');
        next();
    }

    if (req.params.type == "bash") {
        var code = require("../scripts/linux.js")(req.app.get("host"), device.key);
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
        if (req.body.intervalS >= 1) {
            device.intervalMs = req.body.intervalS * 1000;
        }
    }
    device.save();
    res.redirect('/dashboard/devices/' + device.id);
});

router.get('/devices/:id/deleteallimages', async function (req, res, next) {
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
    for (var i = 0; i < images.length; i++) {
        images[i].destroy();
    }
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
            fs.unlink(path.join(__dirname, '../timelaps/output/' + timelapses[i].url), function (err) {
                if (err) {
                    console.log(err);
                }
            });
            await timelapses[i].destroy();
        }
    });

    require("../timelaps/generator.js")(images, framerate, user.id, device.id);
    res.redirect('/dashboard/devices/' + device.id);
});

router.get('/timelaps/:tid/raw', async function (req, res, next) {
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
    // force download
    res.setHeader('Content-disposition', 'attachment; filename=' + timeLaps.url);
    res.setHeader('Content-type', 'video/mp4');
    res.sendFile(path.join(__dirname, '../timelaps/output/' + timeLaps.url));
});

router.get('/timelaps/:tid/stream', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    var timelaps = await db.models.Timelapses.findOne({
        where: {
            id: req.params.tid,
            userId: user.id,
        }
    });
    if (!timelaps) {
        res.redirect('/dashboard/devices/' + req.params.id);
        next();
    }
    var file = path.join(__dirname, '../timelaps/output/' + timelaps.url);
    var stat = fs.statSync(file);
    var total = stat.size;
    if (req.headers.range) {
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var start = parseInt(partialstart, 10);
        var end = start + (1024 * 1024) - 1;
        var chunksize = (end - start) + 1;
        var file = fs.createReadStream(file, {
            start: start,
            end: end
        });
        res.writeHead(206, {
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
        }
        );
        file.pipe(res);

    } else {
        res.writeHead(200, {
            "Content-Length": total,
            "Content-Type": "video/mp4"
        });
        fs.createReadStream(file).pipe(res);
    }
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
    var timelaps = await db.models.Timelapses.findOne({
        where: {
            id: req.params.tid,
            userId: user.id,
        }
    });
    if (!timelaps) {
        res.redirect('/dashboard/');
        next();
    }
    console.log(timelaps)
    res.render('dashboard_timelaps', { user, timelaps, done: timelaps.status == 'terminé' });
});

router.get('/timelaps/:tid/delete', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    var timelaps = await db.models.Timelapses.findOne({
        where: {
            id: req.params.tid,
            userId: user.id,
        }
    });
    if (!timelaps) {
        res.redirect('/dashboard/');
        next();
    }
    fs.unlink(path.join(__dirname, '../timelaps/output/' + timelaps.url), function (err) {
        if (err) {
            console.log(err);
        }
    });
    await timelaps.destroy();
    res.redirect(req.headers.referer);
});

router.get('/timelaps/:tid/infos', async function (req, res, next) {
    var user = req.session.loggedIn ? await db.models.Users.findOne({
        where: {
            id: req.session.userid
        }
    }) : null;
    if (!user) {
        res.redirect('/users/login');
        next();
    }
    var timelaps = await db.models.Timelapses.findOne({
        where: {
            id: req.params.tid,
            userId: user.id,
        }
    });
    if (!timelaps) {
        res.redirect('/dashboard/');
        next();
    }
    let done = timelaps.status == 'terminé';

    res.header('Content-Type', 'application/json');
    res.send(JSON.stringify({
        logs: timelaps.logs,
        status: timelaps.status,
        done: done
    }));
});


router.get('/image/:id', async function (req, res, next) {
    if (!req.session.loggedIn) {
        res.redirect('/users/login');
        next();
    }
    var image = await db.models.Images.findOne({
        attributes: ['url'],
        where: {
            id: req.params.id,
            userId: req.session.userid
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
    res.redirect(req.header('Referer'));


})

module.exports = router;