import fs from 'fs';
import http from 'http';
import url from 'url';

class PostFile {

    constructor(configs) {
        this.url = configs.url;
        this.file = configs.file;
        this.param = configs.param;
        this.field = configs.field;
    }

    start() {
        return new Promise((resolve, reject) => {
            this.postRequest(resolve);
        });
    }

    // 发起 文件请求
    postRequest(sendCallBack) {
        this.filereadstream((buffer) => {
            const options = url.parse(this.url);
            const Header = {};
            const h = this.getBoundary();
            const e = this.fieldPayload();
            const a = this.getFieldHead(this.param, this.file);
            const d = "\r\n" + h;
            Header["Content-Length"] = Buffer.byteLength(h + e + a + d) + buffer.length;
            Header["Content-Type"] = 'audio/pcm;rate=16000';
            options.headers = Header;
            options.method = 'POST';
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    sendCallBack(data);
                });
            });
            req.write(h + e + a);
            req.write(buffer);
            req.end(d);
        });
    }

    fieldPayload() {
        const payload = [];
        for (let id in this.field) {
            payload.push(this.getField(id, this.field[id]));
        }
        payload.push("");
        return payload.join(this.getBoundary());
    }

    getField(field, value) {
        return 'Content-Disposition: form-data; name="' + field + '"\r\n\r\n' + value + '\r\n';
    }

    getFieldHead(field, filename) {
        return 'Content-Disposition: form-data; name="' + field + '"; filename="' + filename + '"\r\n' + 'Content-Type: ' + 'audio/pcm' + '\r\n\r\n';
    }

    getBoundary() {
        return '--' + "----WebKitFormBoundary" + (Math.random() * 9007199254740992).toString(36) + '\r\n';
    }

    filereadstream(fn) {
        const readstream = fs.createReadStream(this.file, {flags: 'r', encoding: null});
        let chunks = [], length = 0;
        readstream.on('data', (chunk) => {
            length += chunk.length;
            chunks.push(chunk);
        });
        readstream.on('end', () => {
            let buffer = new Buffer(length);
            for (let i = 0, pos = 0, size = chunks.length; i < size; i++) {
                chunks[i].copy(buffer, pos);
                pos += chunks[i].length;
            }
            fn(buffer);
        });
    }
}

module.exports = PostFile;