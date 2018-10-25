import fs from 'fs';
import path from 'path';
import mineType from 'mime-types';
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
        this.postRequest();
    }

    postRequest() {
        this.filereadstream((buffer) => {
            let options = url.parse(this.url);
            let Header = {};
            let h = this.getBoundary();
            let e = this.fieldPayload();
            let a = this.getfieldHead(this.param, this.file);
            let d = "\r\n" + h;
            Header["Content-Length"] = Buffer.byteLength(h + e + a + d) + buffer.length;
            Header["Content-Type"] = 'audio/pcm;rate=16000';
            options.headers = Header;
            options.method = 'POST';
            var req = http.request(options, (res) => {
                var data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    console.log(res.statusCode)
                    console.log(data);
                });
            });
            req.write(h + e + a);

            req.write(buffer);
            req.end(d);
        });
    }

    fieldPayload() {
        var payload = [];
        for (var id in this.field) {
            payload.push(this.getfield(id, this.field[id]));
        }
        payload.push("");
        return payload.join(this.getBoundary());
    }

    getfield(field, value) {
        return 'Content-Disposition: form-data; name="' + field + '"\r\n\r\n' + value + '\r\n';
    }

    getfieldHead(field, filename) {
        var fileFieldHead = 'Content-Disposition: form-data; name="' + field + '"; filename="' + filename + '"\r\n' + 'Content-Type: ' + 'audio/pcm' + '\r\n\r\n';
        return fileFieldHead;
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