const dir = 'spec/no-reflect-metadata';

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
    ],
    verbose: false,
};
