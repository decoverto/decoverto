module.exports = {
    extends: '@istanbuljs/nyc-config-typescript',
    all: true,
    include: ['src/**'],
    reporter: ['lcovonly', 'text', 'text-summary'],

    'check-coverage': true,
    branches: 100,
    lines: 100,
    functions: 100,
    statements: 100,
};
