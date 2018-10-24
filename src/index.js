import MiniImageTransfor from './miniImageTransfor';

const config = {
    port: 10086,
    imgPath: './upload',
    ffmpegPath: 'E:\\ffmpeg\\bin\\ffmpeg.exe'
};

const server = new MiniImageTransfor(config);
server.start();