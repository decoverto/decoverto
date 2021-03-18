const dir = 'spec/default/';

export default {
    environmentVariables: {
        TS_NODE_FILES: 'true',
        TS_NODE_PROJECT: `${dir}/tsconfig.spec.json`,
    },
    extensions: [
        'ts',
    ],
    files: [
        `${dir}/**/*.spec.ts`,
    ],
    require: [
        'ts-node/register',
        'reflect-metadata',
    ],
    verbose: false,
};
