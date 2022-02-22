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

    output = path.join(__dirname, '../timelaps/output/' + output);

    let source = "";
    for (let i = 0; i < images.length; i++) {
        source += "file '" + path.join(__dirname, "../images/" + images[i].url) + "'\n";
    }
    let tempFile = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + ".txt";
    tempFile = path.join(__dirname, '../timelaps/' + tempFile);
    fs.writeFileSync(tempFile, source);
    // ${pathToFfmpeg} -r ${framerate} -i ${tempFile} -s 1920x1440 -vcodec libx264 ${output}
    var job = spawn(pathToFfmpeg, ['-i', tempFile, '-r', framerate, '-s', '1920x1440', '-vcodec', 'libx264', output]);
    job.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        timelaps.update({
            logs: timelaps.logs + data + "\n"
        })
    });
    job.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
        timelaps.update({
            logs: timelaps.logs + data + "\n"
        })
    });
    job.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        timelaps.update({
            status: "terminé",
            logs: timelaps.logs + "[INFO] Terminé (" + code + ")\n"
        })
        fs.unlinkSync(tempFile);
    });

    return output;



}

module.exports = createTimeLaps;