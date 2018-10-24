import express from 'express';
import mutipart from 'connect-multiparty';

class MiniImageTransfor {

    constructor(configs) {
        this.port = configs.port;
        this.imgPath = configs.imgPath;
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
        this.app.post('/upload', this.mutipartMiddeware, (req, res) => {
            res.send(req.files['image'].path);
        });
    }
}

module.exports = MiniImageTransfor;