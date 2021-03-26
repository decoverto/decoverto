import test from 'ava';

import {Any, array, Decoverto, map, MapShape, model, property} from '../../src';

const decoverto = new Decoverto();

test('Complex @property should parse', t => {
    @model()
    class ComplexProperty {

        @property(array(map(() => Date, array(Any), {shape: MapShape.Array})))
        arrayOfMapsOfDateArrayAny: Array<Map<Date, Array<any>>>;
    }

    const typeHandler = decoverto.type(ComplexProperty);
    const firstDate = new Date('2021-03-15T07:44:13.907Z');
    const result = typeHandler.plainToInstance({
        arrayOfMapsOfDateArrayAny: [
            [
                {key: firstDate, value: [{foo: true}]},
            ],
        ],
    });
    t.true(result.arrayOfMapsOfDateArrayAny instanceof Array);
    t.true(result.arrayOfMapsOfDateArrayAny[0] instanceof Map);
    t.true(result.arrayOfMapsOfDateArrayAny[0].get(firstDate) instanceof Array);
    t.is(result.arrayOfMapsOfDateArrayAny[0].get(firstDate)?.[0].foo, true);
});
