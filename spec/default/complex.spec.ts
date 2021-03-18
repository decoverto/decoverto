import test from 'ava';

import {Any, array, DecoratedJson, jsonObject, jsonProperty, map, MapShape} from '../../src';

const decoratedJson = new DecoratedJson();

test('Complex @jsonProperty should parse', t => {
    @jsonObject()
    class ComplexProperty {

        @jsonProperty(array(map(() => Date, array(Any), {shape: MapShape.Array})))
        arrayOfMapsOfDateArrayAny: Array<Map<Date, Array<any>>>;
    }

    const typeHandler = decoratedJson.type(ComplexProperty);
    const firstDate = new Date('2021-03-15T07:44:13.907Z');
    const result = typeHandler.parse({
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
