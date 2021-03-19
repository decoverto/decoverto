import * as fs from 'fs';
import * as path from 'path';

import {tsquery} from '@phenomnomnominal/tsquery';
import {isPropertyAssignment, Node} from 'typescript';

const filename = 'diagnostics.ts';
const filepath = path.join(__dirname, '..', 'src', filename);
const ast = tsquery.ast(fs.readFileSync(filepath, 'utf8'));

const codeMap = new Map<string, Array<Node>>();

tsquery(ast, `VariableDeclaration[name.escapedText="Diagnostics"] \
PropertyAssignment[name.escapedText="code"]`).forEach(node => {
    if (!isPropertyAssignment(node)) {
        return;
    }

    const code = node.initializer.getText();
    const nodeArray = codeMap.get(code);
    if (nodeArray === undefined) {
        codeMap.set(code, [node]);
    } else {
        nodeArray.push(node);
    }
});

const duplicates: Array<string> = [];

codeMap.forEach((value, key) => {
    if (value.length <= 1) {
        return;
    }

    const lines = value.map(node => ast.getLineAndCharacterOfPosition(node.getStart()).line + 1);

    duplicates.push(`Diagnostic code ${key} has duplicates. Found on lines: ${lines.join(', ')}.`);
});

if (duplicates.length > 0) {
    console.log(duplicates.join('\n'));
    process.exit(1);
}
