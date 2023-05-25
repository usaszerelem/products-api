import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import AppLogger from '../utils/Logger';

const logger = new AppLogger(module);

module.exports = async function (app: Express) {
    app.use(helmet());
    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const envVars = [
        'PORT',
        'AUDIT_API_KEY',
        'JWT_PRIVATE_KEY',
        'JWT_EXPIRATION',
        'MONGO_HOST',
    ];

    envVars.forEach((element) => {
        if (process.env[element] === undefined) {
            const msg = 'Environment variable ' + element + ' must be set.';
            logger.error(msg);
            throw new Error(msg);
        }
    });
};
