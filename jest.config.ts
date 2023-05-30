/** @type {import('ts-jest').JestConfigWithTsJest} */

import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
    roots: ['<rootDir>/tests'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
};

export default config;
