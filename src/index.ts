import express from 'express';
import https from 'https';
import fs from 'fs';
import AppLogger from './utils/Logger';

const logger = new AppLogger(module);
const app = express();

try {
    logger.info('Loading: ./startup/prod');
    require('./startup/prod')(app);

    logger.info('Loading ./startup/unhandledExceptions');
    require('./startup/unhandledExceptions')();

    logger.info('Loading: ./startup/database');
    require('./startup/database')();

    logger.info('Loading: ./startup/routes');
    require('./startup/routes')(app);

    const port = process.env.PORT;

    var serverSslOptions = {
        rejectUnauthorized: true,
        key: fs.readFileSync('./ssl/key.pem'),
        cert: fs.readFileSync('./ssl/cert.pem'),
        //ca:     fs.readFileSync('./ssl/ca.crt'),
        //requestCert:        true
    };

    if (process.env.NODE_ENV === 'development') {
        logger.warn(
            'Not rejecting unauthorized connections. Running in development mode!'
        );
        serverSslOptions.rejectUnauthorized = false;
    }

    /**
     * @param {object} serverSslOptions - web server initialization options
     * @returns {server} - server object
     */
    const server = https
        .createServer(serverSslOptions, app)
        .listen(port, () => {
            type AddressInfo = {
                address: string;
                family: string;
                port: number;
            };

            let addressInfo = server.address() as AddressInfo;

            if (addressInfo.address === '::') {
                addressInfo.address = 'localhost';
            }

            const msg =
                'Listening on https://' +
                addressInfo.address +
                ':' +
                addressInfo.port;
            logger.info(msg);
        });

    module.exports = server;
} catch (ex) {
    if (ex instanceof Error) {
        logger.error(ex.message);
    } else {
        logger.error('Fatal exception. Service terminated');
    }
}
