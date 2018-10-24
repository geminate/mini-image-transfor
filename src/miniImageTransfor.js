import express from 'express';
import mutipart from 'connect-multiparty';
import ffmpeg from 'fluent-ffmpeg';
import http from 'http';
import querystring from 'querystring';
import uuid from 'uuid';
import fs from 'fs';
import path from 'path';
import mineType from 'mime-types';

class MiniImageTransfor {

    constructor(configs) {
        this.port = configs.port;
        this.imgPath = configs.imgPath;
        this.ffmpegPath = configs.ffmpegPath;
        this.init();
    }

    init() {
        this.mutipartMiddeware = mutipart();
        this.app = express();
        this.app.use(mutipart({uploadDir: this.imgPath}));
    }

    start() {
        this.app.listen(this.port, () => {
            console.log("Express started on http://localhost:" + this.port + ".");
        });

        // 接收临时图片
        this.app.post('/image', this.mutipartMiddeware, (req, res) => {
            res.send("https://kaisrguo.com/hack/" + req.files['image'].path.replace("\\", "/"));
        });

        // 转换音频文件
        this.app.post('/mp3', this.mutipartMiddeware, (req, res) => {
            this.transforMp3(req.files['mp3'].path, (filePath) => {
                console.log('文件转换完成');
                // const base64 = this.transforBase64(filePath);
                this.sendBaiduApi(filePath, (data) => {
                    console.log(data);
                    res.send(data);
                })
            });
        });
    }

    transforMp3(filePath, successCallback) {
        const options = ['-acodec pcm_s16le', '-f s16le', '-ac 1', '-ar 16000'];
        const fileName = uuid.v4() + ".pcm";
        ffmpeg.setFfmpegPath(this.ffmpegPath);
        ffmpeg(filePath)
            .outputOptions(options)
            .on('end', () => successCallback(this.imgPath + "/" + fileName))
            .on('error', (err) => {
                console.log('错误: ' + err.message);
                res.send('错误: ' + err.message);
            })
            .save(this.imgPath + "/" + fileName);
    }

    getfield(field, value) {
        return 'Content-Disposition: form-data; name="' + field + '"\r\n\r\n' + value + '\r\n';
    }

    getfieldHead(field, filename) {
        var fileFieldHead = 'Content-Disposition: form-data; name="' + field + '"; filename="' + filename + '"\r\n' + 'Content-Type: ' + 'audio/pcm' + '\r\n\r\n';
        return fileFieldHead;
    }

    getBoundary() {
        var max = 9007199254740992;
        var dec = Math.random() * max;
        var hex = dec.toString(36);
        var boundary = hex;
        return boundary;
    }

    getBoundaryBorder(boundary) {
        return '--' + boundary + '\r\n';
    }

    fieldPayload(opts) {
        var payload = [];
        for (var id in opts.field) {
            payload.push(getfield(id, opts.field[id]));
        }
        payload.push("");
        return payload.join(this.getBoundaryBorder(opts.boundary));
    }

    postRequest(opts) {
        this.filereadstream(opts, (buffer) => {
            var options = require('url').parse(opts.url);
            var Header = {};
            var h = this.getBoundaryBorder(opts.boundary);
            var e = this.fieldPayload(opts);
            var a = this.getfieldHead(opts.param, opts.file);
            var d = "\r\n" + h;
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

    filereadstream(opts, fn) {
        var readstream = fs.createReadStream(opts.file, {flags: 'r', encoding: null});
        var chunks = [];
        var length = 0;
        readstream.on('data', (chunk) => {
            length += chunk.length;
            chunks.push(chunk);
        });
        readstream.on('end', () => {
            var buffer = new Buffer(length);
            for (var i = 0, pos = 0, size = chunks.length; i < size; i++) {
                chunks[i].copy(buffer, pos);
                pos += chunks[i].length;
            }
            fn(buffer);
        });
    }

    sendBaiduApi(filePath, sendCallBack) {
        var opt = {
            "url": "http://vop.baidu.com/server_api?dev_pid=1536&cuid=******&token=24.695f684b1ef187705cb214aa28550c16.2592000.1542966971.282335-14483285",//url
            "file": filePath,//文件位置
            "param": "file",//文件上传字段名
            "field": {},
            "boundary": "----WebKitFormBoundary" + this.getBoundary()
        }
        this.postRequest(opt);
    }
}

module.exports = MiniImageTransfor;