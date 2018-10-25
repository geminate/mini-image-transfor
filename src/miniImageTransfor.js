import express from 'express';
import mutipart from 'connect-multiparty';
import ffmpeg from 'fluent-ffmpeg';
import uuid from 'uuid';
import postFile from './postFile'

class MiniImageTransfor {

    constructor(configs) {
        this.port = configs.port;
        this.imgPath = configs.imgPath;
        this.ffmpegPath = configs.ffmpegPath;
        this.serverPath = configs.serverPath;
        this.baiduToken = configs.baiduToken;
        this.init();
    }

    init() {
        this.mutipartMiddeware = mutipart();
        this.app = express();
        this.app.use(mutipart({uploadDir: this.imgPath}));
    }

    start() {
        this.startExpressServer();
        this.startImageListener();
        this.startMp3Listener();
    }

    startExpressServer() {
        this.app.listen(this.port, () => {
            console.log("服务器已启动于 http://localhost:" + this.port + ".");
        });
    }

    startImageListener() {
        this.app.post('/image', this.mutipartMiddeware, (req, res) => {
            const imgUrl = this.serverPath + req.files['image'].path.replace("\\", "/");
            console.log("图片转储完成，地址：" + imgUrl);
            res.send(imgUrl);
        });
    }

    startMp3Listener() {
        this.app.post('/mp3', this.mutipartMiddeware, (req, res) => {
            this.transforMp3(req.files['mp3'].path, (filePath) => {
                console.log('文件转换完成');
                this.sendBaiduApi(filePath, (data) => {
                    console.log("语音识别完成，内容：" + data);
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

    sendBaiduApi(filePath, sendCallBack) {
        const opt = {
            "url": "http://vop.baidu.com/server_api?dev_pid=1536&cuid=******&token=" + this.baiduToken,
            "file": filePath,//文件位置
            "param": "file",//文件上传字段名
            "field": {}
        };

        new postFile(opt).start();
    }

}

module.exports = MiniImageTransfor;