import MiniImageTransfor from './miniImageTransfor';

const config = {
    port: 10086,
    imgPath: './upload',
    serverPath: 'https://kaisrguo.com/hack/',
    baiduToken: '24.695f684b1ef187705cb214aa28550c16.2592000.1542966971.282335-14483285',
    retryNum: 3,
    ffmpegPath: 'E:\\ffmpeg\\bin\\ffmpeg.exe'
};

const server = new MiniImageTransfor(config);
server.start();