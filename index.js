const core = require('@actions/core');
const qiniu = require('qiniu')
const {https} = require('follow-redirects');

const url = core.getInput('url');
const accessKey = core.getInput('access_key');
const secretKey = core.getInput('secret_key');
const bucket = core.getInput('bucket');
const key = core.getInput('key');
const overwrite = core.getInput('overwrite');

try {
  https.get(url, response => {
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const options = overwrite.toLowerCase() === 'yes' ? {scope: `${bucket}:${key}`} : {scope: bucket};
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);
    const config = new qiniu.conf.Config();
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();

    core.info(`Download ${url} to ${bucket}:${key}`)

    formUploader.putStream(uploadToken, key, response, putExtra, (error, body, info) => {
      if (error) {
        throw error;
      }
      if (info.statusCode === 200) {
          core.setOutput("hash", body.hash);
          core.setOutput("key", body.key);
      } else {
        console.log(info.statusCode);
        console.log(body);
      }
    });
  })
} catch (error) {
  core.setFailed(error.message);
}
