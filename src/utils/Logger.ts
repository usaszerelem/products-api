import winston from 'winston';
import path from 'path';
import config from 'config';
import DailyRotateFile = require('winston-daily-rotate-file');

const { combine, timestamp, printf, colorize, json } = winston.format;

/**
 * Initializes the logging system for a specific file
 */

export default class AppLogger {
    private _location: string;
    private _meta: string;
    private _fileLogger: winston.Logger | null;
    private _consoleLogger: winston.Logger | null;
    private _logLevel: string;
    private _consoleLogEnabled: boolean;
    private _fileLogEnabled: boolean;

    constructor(callingModule: { filename: string }) {
        var parts = callingModule.filename.split('/');
        this._location = parts[parts.length - 2] + '/' + parts.pop();
        this._meta = '';
        this._fileLogger = null;
        this._consoleLogger = null;
        this._logLevel = config.get('log.level') as string;
        this._consoleLogEnabled = config.get(
            'log.consoleLogEnabled'
        ) as boolean;
        this._fileLogEnabled = config.get('log.fileLogEnabled') as boolean;

        this.configFileLogger(callingModule.filename);
        this.configConsoleLogger(callingModule.filename);
    }

    error(message: string, jSonMetaData: object | undefined = undefined): void {
        this._fileLogger?.error(message, this.getLogFileDefault(jSonMetaData));
        this._consoleLogger?.error(message);
    }

    warn(message: string, jSonMetaData: object | undefined = undefined): void {
        this._fileLogger?.warn(message, this.getLogFileDefault(jSonMetaData));
        this._consoleLogger?.warn(message);
    }

    info(message: string, jSonMetaData: object | undefined = undefined): void {
        this._fileLogger?.info(message, this.getLogFileDefault(jSonMetaData));
        this._consoleLogger?.info(message);
    }

    debug(message: string, jSonMetaData: object | undefined = undefined): void {
        this._fileLogger?.debug(message, this.getLogFileDefault(jSonMetaData));
        this._consoleLogger?.debug(message);
    }

    /**
     * Adds default metadat to a log entry
     * @param jSonMetaData {object} - optional default metadata to add to log
     * @returns {object} JSON object
     */
    getLogFileDefault(jSonMetaData: object | undefined): object {
        let logFileDefault = {
            location: this._location,
        };

        this._meta = '';

        if (jSonMetaData !== undefined && this.isJSON(jSonMetaData) === true) {
            logFileDefault = Object.assign({}, jSonMetaData, logFileDefault);
            this._meta = JSON.stringify(jSonMetaData);
        }

        return logFileDefault;
    }

    /**
     *
     * @param callingModuleFileName {string} - full path to the calling module
     *  so that the name portion can be used to identify the file logger.
     */
    private configFileLogger(callingModuleFileName: string) {
        /**
         * If file logging is enabled via the FILELOG_ENABLED environment variable and
         * jest is not running, then initialize file logger. If jest is running then
         * we disable logging as logging causes difficult to comprehend jest output.
         */

        let fileLoggerName = 'fileLogger-';

        fileLoggerName += callingModuleFileName.slice(
            callingModuleFileName.lastIndexOf(path.sep) + 1,
            callingModuleFileName.length - 3
        );

        if (this._fileLogEnabled === true && typeof jest === 'undefined') {
            const fileRotateTransport = new DailyRotateFile({
                filename: 'AppLog-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxFiles: '4d',
            });

            winston.loggers.add(fileLoggerName, {
                level: this._logLevel || 'info',
                format: combine(timestamp(), json()),
                transports: [fileRotateTransport],
            });

            this._fileLogger = winston.loggers.get(fileLoggerName);
        }
    }

    /**
     *
     * @param callingModuleFileName {string} - full path to the calling module
     *  so that the name portion can be used to identify the console logger.
     */
    configConsoleLogger(callingModuleFileName: string): void {
        /**
         * If file logging is enabled via the FILELOG_ENABLED environment variable and
         * jest is not running, then initialize file logger. If jest is running then
         * we disable logging as logging causes difficult to comprehend jest output.
         */

        let consoleLoggerName = 'consoleLogger-';

        consoleLoggerName += callingModuleFileName.slice(
            callingModuleFileName.lastIndexOf(path.sep) + 1,
            callingModuleFileName.length - 3
        );

        if (this._consoleLogEnabled && typeof jest === 'undefined') {
            winston.loggers.add(consoleLoggerName, {
                level: this._logLevel || 'info',
                format: combine(
                    colorize({ all: true }),
                    timestamp(),
                    printf(
                        (info) =>
                            `[${info.timestamp}] ${info.level}: ${this._location}, ${info.message} ${this._meta}`
                    )
                ),

                transports: [new winston.transports.Console()],
            });

            this._consoleLogger = winston.loggers.get(consoleLoggerName);
        }
    }

    /**
     * Returns a Boolean true if the passed data is a JSON object
     *
     * @param {object} data - data to check
     * @returns {boolean} - true if JSON object, false otherwise
     */

    isJSON(jSonObj: object): boolean {
        var ret = true;
        try {
            JSON.parse(JSON.stringify(jSonObj));
        } catch (e) {
            ret = false;
        }
        return ret;
    }
}
