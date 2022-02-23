var express = require('express');
var router = express.Router();
var db = require('../database/index.js');
var fs = require('fs');
var path = require('path');

router.post('/v1/send/:key', async function (req, res, next) {
    device = await db.models.Devices.findOne({
        where: {
            key: req.params.key
        }
    })
    if (!device) {
        res.sendStatus(404).send("Device not found")
    }
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // check if image (file) is a jpg image 
    // if (req.files.file.mimetype != "image/jpeg" && req.files.file.mimetype != "image/jpg") {
    //     return res.status(400).send('File is not a jpg image');
    // }

    // save image in ../images/
    let randomkey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    randomkey += "_" + Date.now();
    var imagePath = path.join(__dirname, '../images/' + randomkey + '.jpg');
   
    // console.log(req.files)
    req.files.file.mv(imagePath, function (err) {
        if (err)
            return res.status(500).send("Error while saving image");
    });

    // save image in database
    var image = await db.models.Images.create({
        deviceId: device.id,
        url: randomkey + '.jpg',
        userId: device.userId,
        name: req.files.file.name
    })
    if (image) {
        res.send(device.intervalMs + "") // send interval in ms
    } else {
        res.sendStatus(500).send("Error while saving image (2)")
    }




});

module.exports = router;
