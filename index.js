const core = require('@actions/core');
const qiniu = require('qiniu')
const request = require('request')
const fs = require('fs')

const path = '/tmp/cowboy'
const url = core.getInput('url');
const accessKey = core.getInput('access_key');
const secretKey = core.getInput('secret_key');
const bucket = core.getInput('bucket');
const key = core.getInput('key');
const overwrite = core.getInput('overwrite');

try {
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const options = overwrite.toLowerCase() === 'yes' ? {scope: `${bucket}:${key}`} : {scope: bucket};
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);
    const config = new qiniu.conf.Config();
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();

    request(url).pipe(fs.createWriteStream(path))
        .on('close', () => core.info(`Download ${url} to ${path} done.`))

    formUploader.putFile(uploadToken, key, path, putExtra, (error, body, info) => {
        if (error) {
            throw error;
        }
        if (info.statusCode === 200) {
            core.setOutput("hash", body.hash);
            core.setOutput("key", body.key);
        } else {
            core.warning(info.statusCode);
            core.warning(body);
        }

    });
} catch (error) {
    core.setFailed(error.message);
}
