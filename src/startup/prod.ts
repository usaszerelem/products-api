import express, { Express } from 'express';
import config from 'config';
import helmet from 'helmet';
import compression from 'compression';
import AppLogger from '../utils/Logger';

const logger = new AppLogger(module);

export function CheckEnvVars(app: Express) {
    app.use(helmet());
    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const envVars: string[] = [
        'name',
        'nodeEnv',
        'log.level',
        'log.consoleLogEnabled',
        'log.fileLogEnabled',
        'port',
        'jwt.privateKey',
        'jwt.expiration',
        'audit.url',
        'audit.apiKey',
        'db.url',
    ];

    let allVarsCorrect = true;
    logger.info('Config environment variables:');

    for (let idx = 0; idx < envVars.length; idx++) {
        if (config.has(envVars[idx]) === true) {
            const envVar = config.get(envVars[idx]);

            if (envVar === undefined) {
                allVarsCorrect = false;
                logger.error(`*** ERROR: Underfined: "${envVars[idx]}"`);
            } else {
                logger.info(`${envVars[idx]} = ${envVar}`);
            }
        } else {
            console.log(`*** ERROR: Not configured: "${envVars[idx]}"`);
        }
    }

    if (allVarsCorrect === false) {
        const msg = 'Environment variable incorrectly set.';
        logger.error(msg);
        throw new Error(msg);
    }
}
