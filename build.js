const fs = require('fs');
const {exec} = require('child_process');

const deleteAll = (path) => {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            const curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteAll(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

const readSyncByfs = (tips) => {
    tips = tips || '> ';
    process.stdout.write(tips);
    process.stdin.pause();

    const buf = Buffer.allocUnsafe(10000);
    let response = fs.readSync(process.stdin.fd, buf, 0, 10000, 0);
    process.stdin.end();

    return buf.toString('utf8', 0, response).trim();
}

deleteAll('./build');

exec('npm run lint && tsc', (err, stdout, stderr) => {
    if(err) {
        console.log(err);
        return;
    }
    console.log(stdout);
    console.log(stderr);

    // 拷贝packagejson到输出目录下
    const version = readSyncByfs('设置发布的版本号: ');
    const packages = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    packages.version = version;
    fs.writeFileSync('./build/package.json', JSON.stringify(packages));
    exec('cd ./build && npm publish . --access=public', (err, stdout, stderr) => {
        if(err) {
            console.log(err);
            return;
        }
        console.log(stdout);
        console.log(stderr);
    });
});
