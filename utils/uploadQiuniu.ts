import qiniu from 'qiniu';
import fs from 'fs';
import { accessKey, secretKey } from './config';
var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
var options = {
  scope: 'polkawallet',
};
var putPolicy = new qiniu.rs.PutPolicy(options);
var uploadToken = putPolicy.uploadToken(mac);

var config = new qiniu.conf.Config({
  zone: qiniu.zone.Zone_z2
});
var formUploader = new qiniu.form_up.FormUploader(config);
var putExtra = new qiniu.form_up.PutExtra();

export const put = async () => {
  var localFile = `./lastPrice.json`;
  var key = `lastPrice.json`;
  // 文件上传
  return new Promise((res, rej) => {
    formUploader.putFile(uploadToken, key, localFile, putExtra, function (respErr,
      respBody, respInfo) {
      if (respErr) {
        rej(respErr);
      }
      if (respInfo.statusCode == 200) {
        res(respBody)
      } else {
        res(respBody)
      }
    });
  })
}

export const upload = (data: any) => {
  fs.writeFile('./lastPrice.json', data, (err) => {
    if(!err) {
      put();
    }
  });
}