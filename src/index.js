import MiniImageTransfor from './miniImageTransfor';

const config = {
    port: 10086,
    imgPath: './upload'
};

const server = new MiniImageTransfor(config);
server.start();