var pathToFfmpeg = require('ffmpeg-static');
const { spawn } = require('child_process')
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
    console.log(JSON.stringify(timelaps,null,4))
    output = path.join(__dirname, '../timelaps/output/' + output);

    let source = "";
    for (let i = 0; i < images.length; i++) {
        source += "file '" + path.join(__dirname, "../images/" + images[i].url) + "'\n";
    }
    let tempFile = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + ".txt";
    tempFile = path.join(__dirname, '../timelaps/' + tempFile);
    fs.writeFileSync(tempFile, source);
    // ${pathToFfmpeg} -r ${framerate} -i ${tempFile} -s 1920x1440 -vcodec libx264 ${output}
    var logs = "";
    var job = spawn(pathToFfmpeg, ['-f', 'concat', '-safe', '0', '-i', tempFile, '-r', framerate, '-s', '1920x1440', '-vcodec', 'libx264', '-f', 'mp4', output]);
    job.stdout.on('data', (data) => {
        logs += data.toString() + "\n";


        db.models.Timelapses.update({
            logs: logs.toString()
        }, {
            where: {
                id: timelaps.id
            }
        }).then(function (result) {
            console.log(result);
        })
    });
    job.stderr.on('data', (data) => {
        logs += data.toString() + "\n";


        db.models.Timelapses.update({
            logs: logs.toString()
        }, {
            where: {
                id: timelaps.id
            }
        }).then(function (result) {
            console.log(result);
        })

    });
    job.on('close', (code) => {
        // console.log(`child process exited with code ${code}`);
        logs += "[INFO] Process exited with code " + code + "\n";

        db.models.Timelapses.update({
            logs: logs.toString(),
            status: "terminé"
        }, {
            where: {
                id: timelaps.id
            }
        }).then(function (result) {
            console.log(result);
        })
        fs.unlinkSync(tempFile);
    });

    return output;



}

module.exports = createTimeLaps;