var pathToFfmpeg = require('ffmpeg-static');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var db = require('../database/index.js');
const path = require('path');
const fs = require('fs');
async function createTimeLaps(images, framerate, userid, deviceid) {
    framerate = parseInt(framerate);
    // create temp file with images 
    console.log("createTimeLaps")
    let output = "output-" + Math.random().toString(36).substring(2, 15) + ".mp4";
    var timelaps = await db.models.Timelapses.create({
        name: "",
        userId: userid,
        deviceId: deviceid,
        start: new Date(),
        end: new Date(),
        status: "en cours",
        framerate: framerate,
        url: output,
        logs: ""
    }).catch(err => {
        console.error(err);
    });

    output = path.join(__dirname, '../timelaps/output/' + output);

    let source = "";
    for (let i = 0; i < images.length; i++) {
        source += "file '" + path.join(__dirname, "../images/" + images[i].url) + "'\n";
    }
    let tempFile = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + ".txt";

    fs.writeFileSync(tempFile, source);

    var job = await exec(`${pathToFfmpeg} -y -f concat -safe 0 -i ${tempFile} -framerate ${framerate} -c:v libx264 -pix_fmt yuv420p -r 30 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -preset ultrafast -crf 0 -c:a copy ${output}`)

    timelaps.logs = job.stdout;
    timelaps.status = "terminé";
    timelaps.save();

    fs.unlinkSync(tempFile);

    return output;



}

module.exports = createTimeLaps;