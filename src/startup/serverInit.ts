import { Express } from 'express';
import AppLogger from '../utils/Logger';
import config from 'config';
import { InitDatabase } from './database';
import { OnUnhandledErrors } from './unhandledExceptions';
import { InitRoutes } from './routes';
import { CheckEnvVars } from './prod';

const logger = new AppLogger(module);

/**
 * Initializes service startup subsystems
 */
export async function ServerInit(expApp: Express): Promise<void> {
    logger.info('Service name: ' + config.get('name'));
    logger.info('Loading: ./startup/prod');
    CheckEnvVars(expApp);

    logger.info('Loading: ./startup/database');
    await InitDatabase();

    logger.info('Loading ./startup/unhandledExceptions');
    OnUnhandledErrors();

    logger.info('Loading: ./startup/routes');
    InitRoutes(expApp);
}
