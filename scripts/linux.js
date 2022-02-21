
var code = `
#!/bin/env bash\n
echo "Verify dependencies"\n
# check if fswebcam is installed\n
# fswebcam --version > check if contains "fswebcam"\n
if ! type fswebcam > /dev/null; then\n
    echo "fswebcam is not installed"\n
    echo "installation of fswebcam"\n
    sudo apt-get install fswebcam -y\n
fi\n
echo "NOTE:"\n
echo "vous pouvez aussi lancer le script automatiquement au demarrage avec : sudo crontab -e"\n
echo "Voir https://www.google.com/search?q=script+on+startup+linux"
\n
echo "Timelabs Linux Script"\n
echo "===================="\n
\n
while true; do\n
    
    fswebcam -r 1920x1080 -S 30 --no-banner /tmp/frame.jpg\n
    wait=$(curl -X POST -F "file=@/tmp/frame.jpg" {{DOMAINE}}api/v1/send/{{KEY}})e-3s\n
    echo "waiting: $wait"\n
    sleep $wait\n
    
done\n
`
function generate(domaine, key) {
    let customCode = code.replace(/{{DOMAINE}}/g, domaine);
    customCode = customCode.replace(/{{KEY}}/g, key);
    return customCode;
}

module.exports = generate