import {execSync} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import {
    createCompilerHost,
    createProgram,
    createSourceFile,
    ModuleKind,
    ScriptTarget,
    SourceFile,
} from 'typescript';

const amountOfProperties = 20000;
const amountOfTests = 1000;

const properties: Array<string> = [];

for (let i = 0; i < amountOfProperties; i++) {
    properties.push(`
    @jsonProperty(() => Number)
    property${i}!: number;`);
}

const fileContent = `\
const {jsonObject, jsonProperty} = require('../../../lib/cjs/index');

@jsonObject()
class Test {
${properties.join('\n')}
}
`;

execSync('yarn run build', {
    cwd: path.join(__dirname, '..', '..'),
});

const file: {
    content: string;
    sourceFile?: SourceFile;
    name: string;
} = {
    content: fileContent,
    name: 'test.local.ts',
};

const options = {
    experimentalDecorators: true,
    module: ModuleKind.CommonJS,
    outDir: __dirname,
    strict: true,
    strictPropertyInitialization: false,
    target: ScriptTarget.ES2019,
};
const compilerHost = createCompilerHost(options);

const getSourceFileOriginal = compilerHost.getSourceFile.bind(compilerHost);
compilerHost.getSourceFile = (...arg) => {
    if (arg[0] === file.name) {
        file.sourceFile = file.sourceFile ?? createSourceFile(
            file.name,
            file.content,
            options.target,
        );
        return file.sourceFile;
    }

    return getSourceFileOriginal(...arg);
};

const program = createProgram([file.name], options, compilerHost);
program.emit();

const executionMemorySizes = [];
const executionTimes = [];

for (let i = 0; i < amountOfTests; i++) {
    const output = execSync(`/usr/bin/time \
--format "%M %U" \
node ${__dirname}/test.local.js 2>&1`, {
        encoding: 'utf8',
    });
    const [maxMemory, executionTime] = output.split(' ');
    executionMemorySizes.push(Number(maxMemory));
    executionTimes.push(Number(executionTime));
}

function median(values: Array<number>): number {
    const sortedValues = values.slice().sort((a, b) => a - b);
    const half = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2 === 1) {
        return values[half];
    }

    return (values[half - 1] + values[half]) / 2;
}

console.log(`Executed file with ${amountOfProperties} properties ${amountOfTests} times \
resulting in a median max memory usage of ${median(executionMemorySizes)} KB and median execution \
time of ${median(executionTimes)} seconds`);

fs.unlinkSync(path.join(__dirname, `${path.parse(file.name).name}.js`));
