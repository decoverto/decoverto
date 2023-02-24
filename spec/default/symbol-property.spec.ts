import test from 'ava';

import {Decoverto, property} from '../../src';

const decoverto = new Decoverto();

test('Symbol property should work', t => {
    const symb = Symbol('prop');
    class ClassWithSymbol {
        @property()
        [symb]: string;
    }

    const typeHandler = decoverto.type(ClassWithSymbol);
    const subject = new ClassWithSymbol()
    subject[symb] = 'test';
    const result = typeHandler.instanceToPlain(subject)
    t.deepEqual(result, {
        prop: 'test',
    })

});
