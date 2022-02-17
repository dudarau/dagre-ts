module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transformIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'd.ts'],
  verbose: true,
};
