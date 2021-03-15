import {Any, array, DecoratedJson, jsonMember, jsonObject, map, MapShape} from '../src';

const decoratedJson = new DecoratedJson();

describe('Complex members', () => {
    @jsonObject()
    class ComplexMember {

        @jsonMember(array(map(() => Date, array(Any), {shape: MapShape.Array})))
        arrayOfMapsOfDateArrayAny: Array<Map<Date, Array<any>>>;
    }

    const typeHandler = decoratedJson.type(ComplexMember);

    it('parses', () => {
        const firstDate = new Date('2021-03-15T07:44:13.907Z');

        const result = typeHandler.parse({
            arrayOfMapsOfDateArrayAny: [
                [
                    {key: firstDate, value: [{foo: true}]},
                ],
            ],
        });
        expect(result.arrayOfMapsOfDateArrayAny).toBeInstanceOf(Array);
        expect(result.arrayOfMapsOfDateArrayAny[0]).toBeInstanceOf(Map);
        expect(result.arrayOfMapsOfDateArrayAny[0].get(firstDate)).toBeInstanceOf(Array);
        expect(result.arrayOfMapsOfDateArrayAny[0].get(firstDate)?.[0].foo).toBe(true);
    });
});
