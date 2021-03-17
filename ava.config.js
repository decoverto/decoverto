export default {
    environmentVariables: {
        TS_NODE_FILES: 'true',
        TS_NODE_PROJECT: 'tsconfig/tsconfig.spec.json',
    },
    extensions: [
        'ts',
    ],
    files: [
        'spec/**/*.spec.ts',
    ],
    require: [
        'ts-node/register',
        'reflect-metadata',
    ],
    verbose: true,
};
