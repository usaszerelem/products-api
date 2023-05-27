/** @type {import('ts-jest').JestConfigWithTsJest} */
/*
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
};
*/

import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
    roots: ['<rootDir>/tests'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
};

export default config;
