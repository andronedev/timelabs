var pathToFfmpeg = require('ffmpeg-static');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var db = require('../database/index.js');
async function createTimeLaps(images, framerate, userid, deviceid) {
    // create temp file with images 
    let output = "output-"+Math.random().toString(36).substring(2, 15)+".mp4";
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
    });

    let source = "";
    for(let i = 0; i < images.length; i++){
        source += "file '" + images[i].url + "'\n";
    }
    let tempFile = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + ".txt";
    
    fs.writeFileSync(tempFile, source);
    
    await exec(`${pathToFfmpeg} -y -f concat -safe 0 -i ${tempFile} -framerate ${framerate} -c:v libx264 -pix_fmt yuv420p -r 30 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -preset ultrafast -crf 0 -c:a copy ${output}.mp4`, (error, stdout, stderr) => {
        timelaps.update({
            logs: stdout
        });
        if (error) {
            timelaps.update({
                status: "erreur",
                logs: stderr
            });
            console.error(`exec error: ${error}`);
            return;
        }else {
            timelaps.update({
                status: "terminé"
            });
        }
    });

    fs.unlinkSync(tempFile);

    return output;



}

module.exports = createTimeLaps;