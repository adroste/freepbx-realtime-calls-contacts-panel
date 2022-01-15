/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: [ "<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)" ]
};
