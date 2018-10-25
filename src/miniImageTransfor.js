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
        this.retryNum = configs.retryNum;
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

    // 启动 Express 服务器
    startExpressServer() {
        this.app.listen(this.port, () => {
            console.log("服务器已启动于 http://localhost:" + this.port + ".");
        });
    }

    // 启动 图片转储 监听
    startImageListener() {
        this.app.post('/image', this.mutipartMiddeware, (req, res) => {
            const imgUrl = this.serverPath + req.files['image'].path.replace("\\", "/");
            console.log("图片转储完成，地址：" + imgUrl);
            res.send(imgUrl);
        });
    }

    // 启动 语音识别 监听
    startMp3Listener() {
        this.app.post('/mp3', this.mutipartMiddeware, (req, res) => {
            this.transforMp3(req.files['mp3'].path, (filePath) => {
                console.log('------ START:' + new Date().getTime() + ' ------');
                console.log('文件转换完成');
                this.sendBaiduApi(filePath, 0, (data) => {
                    console.log("语音识别完成，内容：" + data);
                    console.log('------ END ------');
                    res.send(data);
                })
            });
        });
    }

    // 将 MP3 格式转换为百度接口 可识别的 pcm 格式
    transforMp3(filePath, successCallback) {
        const options = ['-acodec pcm_s16le', '-f s16le', '-ac 1', '-ar 16000'];
        const fileName = uuid.v4() + ".pcm";
        ffmpeg.setFfmpegPath(this.ffmpegPath);
        ffmpeg(filePath)
            .outputOptions(options)
            .on('end', () => successCallback(this.imgPath + "/" + fileName))
            .on('error', (err) => {
                console.log('错误: ' + err.message);
            })
            .save(this.imgPath + "/" + fileName);
    }

    // 调用 百度语音识别接口
    sendBaiduApi(filePath, num, sendCallBack) {
        const opt = {
            "url": "http://vop.baidu.com/server_api?dev_pid=1536&cuid=******&token=" + this.baiduToken,
            "file": filePath,// 文件位置
            "param": "file",// 文件上传字段名
            "field": {}// 其他字段
        };
        const fetchArray = [];
        for (let i = 0; i <= this.retryNum; i++) {
            fetchArray.push(new postFile(opt).start());
        }
        const fetchPromise = Promise.all(fetchArray);
        fetchPromise.then((result) => {
            console.log(result);
            const successArray = result.filter((item) => {
                return JSON.parse(item).err_no == 0;
            });
            if (successArray.length > 0) {
                sendCallBack(successArray[0]);
            } else {
                sendCallBack(result[0]);
            }
        });
    }
}

module.exports = MiniImageTransfor;