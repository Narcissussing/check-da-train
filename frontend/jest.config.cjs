module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|svg)$': '<rootDir>/src/__mocks__/fileMock.cjs',
    '\\.css$': '<rootDir>/src/__mocks__/styleMock.cjs',
  },
}
