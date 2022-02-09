import qiniu from 'qiniu';
import fs from 'fs';
import { accessKey, secretKey } from './config';
const localFile = `./lastPrice.json`;
const key = `lastPrice.json`;
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const options = {
  scope: `polkawallet:${key}`,
};
const putPolicy = new qiniu.rs.PutPolicy(options);
const uploadToken = putPolicy.uploadToken(mac);

const config = new qiniu.conf.Config({
  zone: qiniu.zone.Zone_z2
});
const formUploader = new qiniu.form_up.FormUploader(config);
const putExtra = new qiniu.form_up.PutExtra();

export const upload = async (data: any) => {
  return new Promise((res, rej) => {
    fs.writeFile('./lastPrice.json', data, (err) => {
      if (!err) {
        formUploader.putFile(uploadToken, key, localFile, putExtra, (respErr, respBody, respInfo) => {
          if (respErr) {
            rej(respErr)
          } else {
            res({respBody: {...respBody}, respInfo: {...respInfo}})
          }
        });
      } else {
        rej(err)
      }
    });
  })
}