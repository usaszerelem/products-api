import config from 'config';
import express, { Express } from 'express';
import fs from 'fs';
import AppLogger from './utils/Logger';
import { Server as HttpServer } from 'http';
import https, { Server as HttpsServer } from 'https';
import { ServerInit } from './startup/serverInit';

const logger = new AppLogger(module);
const app: Express = express();

var server: HttpServer<any, any> | HttpsServer<any, any> | undefined =
    undefined;

type AddressInfo = {
    address: string;
    family: string;
    port: number;
};

try {
    ServerInit(app);

    const port = config.get('port');

    if (config.get('nodeEnv') === 'development') {
        /*
        logger.warn(
            'Not rejecting unauthorized connections. Running in development mode!'
        );
        serverSslOptions.rejectUnauthorized = false;
        */

        server = app.listen(port, () => {});
        serverListening(server.address() as AddressInfo, true);
    } else {
        var serverSslOptions = {
            rejectUnauthorized: true,
            key: fs.readFileSync('./ssl/key.pem'),
            cert: fs.readFileSync('./ssl/cert.pem'),
            //ca: fs.readFileSync('./ssl/ca.crt'),
            //requestCert: true
        };

        var httpSrv = https.createServer(serverSslOptions, app);
        server = httpSrv.listen(port, () => {});
        serverListening(server.address() as AddressInfo);
    }
} catch (ex) {
    if (ex instanceof Error) {
        logger.error(ex.message);
    } else {
        logger.error('Fatal exception. Service terminated');
    }
}
/**
 * Logs information about the server's connection
 * @param addrInfo - information returned from listen()
 * @param isHttps - 'true' if secure connection
 */

function serverListening(
    addrInfo: AddressInfo,
    isHttps: boolean = false
): void {
    if (addrInfo?.address === '::') {
        addrInfo.address = 'localhost';
    }

    if (isHttps === true) {
        logger.info(
            'Listening on https://' + addrInfo.address + ':' + addrInfo.port
        );
    } else {
        logger.info(
            'Listening on http://' + addrInfo.address + ':' + addrInfo.port
        );
    }
}

export default server;
