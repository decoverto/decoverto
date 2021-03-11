import {DecoratedJson, jsonArrayMember, jsonMember, jsonObject} from '../src';

const date2000 = '2000-01-01T00:00:00.000Z';
const date3000 = '3000-01-01T00:00:00.000Z';

describe('mapped types', () => {
    class CustomType {
        value: any;

        constructor(value: any) {
            this.value = value;
        }

        hasSucceeded(): boolean {
            return this.value != null;
        }
    }

    @jsonObject()
    class MappedTypesSpec {

        @jsonMember()
        one: CustomType;

        @jsonMember()
        two: CustomType;
    }

    const testData = {
        one: 1,
        two: 2,
    };

    let decoratedJson: DecoratedJson;

    beforeEach(() => {
        decoratedJson = new DecoratedJson();
    });

    describe('instance', () => {
        decoratedJson = new DecoratedJson();
        decoratedJson.mapType(CustomType, {
            deserializer: json => new CustomType(json),
            serializer: value => value.value,
        });

        const mappedTypesSpecHandler = decoratedJson.type(MappedTypesSpec);

        it('deserializes', () => {
            const result = mappedTypesSpecHandler.parse(testData);

            expect(result.one).toBeInstanceOf(CustomType);
            expect(result.one.hasSucceeded()).toBeTrue();
            expect(result.two).toBeInstanceOf(CustomType);
            expect(result.two.hasSucceeded()).toBeTrue();
        });

        it('serializes', () => {
            const test = new MappedTypesSpec();
            test.one = new CustomType(1);
            test.two = new CustomType(2);
            const result = mappedTypesSpecHandler.toPlainJson(test);

            expect(result).toEqual(testData);
        });
    });

    it('can be overwritten with deserializer/serializer prop', () => {
        const jsonMemberOptions = {
            deserializer: json => new CustomType(0),
            serializer: value => 1,
        };

        const CustomTypeMap = {
            deserializer: json => new CustomType(json),
            serializer: value => value.value,
        };

        spyOn(CustomTypeMap, 'serializer').and.callThrough();
        spyOn(jsonMemberOptions, 'serializer').and.callThrough();
        spyOn(CustomTypeMap, 'deserializer').and.callThrough();
        spyOn(jsonMemberOptions, 'deserializer').and.callThrough();

        @jsonObject()
        class OverriddenSerializer {
            @jsonMember(jsonMemberOptions)
            overwritten: CustomType;

            @jsonMember()
            simple: CustomType;
        }

        decoratedJson.mapType(CustomType, CustomTypeMap);
        const overriddenSerializerHandler = decoratedJson.type(OverriddenSerializer);

        const parsed = overriddenSerializerHandler.parse({data: 5, simple: 5});
        expect(CustomTypeMap.deserializer).toHaveBeenCalledTimes(1);
        expect(jsonMemberOptions.deserializer).toHaveBeenCalledTimes(1);
        expect(parsed.overwritten.value).toBe(0);
        expect(parsed.simple.value).toBe(5);

        const plain = overriddenSerializerHandler.toPlainJson(parsed);
        expect(CustomTypeMap.serializer).toHaveBeenCalledTimes(1);
        expect(jsonMemberOptions.serializer).toHaveBeenCalledTimes(1);
        expect(plain.overwritten).toBe(1);
        expect(plain.simple).toBe(5);
    });

    it('should use default when only mapping deserializer', () => {
        @jsonObject()
        class OnlyDeSerializer {
            @jsonMember()
            date: Date;
        }

        decoratedJson.mapType<Date, Date>(Date, {
            deserializer: value => new Date(new Date(value).setFullYear(3000)),
        });
        const onlyDeserializerHandler = decoratedJson.type(OnlyDeSerializer);
        const parsed = onlyDeserializerHandler.parse({date: date2000});

        expect(parsed.date.toISOString()).toEqual(date3000);
        expect((onlyDeserializerHandler.toPlainJson(parsed) as any).date.toString())
            .toEqual(new Date(date3000).toString());
    });

    it('should use default when only mapping serializer', () => {
        @jsonObject()
        class OnlySerializer {
            @jsonMember()
            date: Date;
        }

        decoratedJson.mapType(Date, {
            serializer: value => new Date(value.setFullYear(3000)).toISOString(),
        });
        const OnlySerializerHandler = decoratedJson.type(OnlySerializer);

        const test = new OnlySerializer();
        test.date = new Date(date2000);
        const result = OnlySerializerHandler.toPlainJson(test);

        expect(result).toEqual({date: date3000});
        expect(OnlySerializerHandler.parse({date: date2000}).date.toISOString()).toEqual(date2000);
    });

    it('should handle mapping arrays', () => {
        @jsonObject()
        class MappedTypeWithArray {

            @jsonArrayMember(() => String)
            array: Array<string>;
        }

        const ArrayTypeMap = {
            deserializer: json => ['deserialized'],
            serializer: value => ['serialized'],
        };

        decoratedJson.mapType(Array, ArrayTypeMap);

        const mappedTypeWithArrayHandler = decoratedJson.type(MappedTypeWithArray);

        spyOn(ArrayTypeMap, 'serializer').and.callThrough();
        spyOn(ArrayTypeMap, 'deserializer').and.callThrough();
        const parsed = mappedTypeWithArrayHandler.parse({array: ['hello']});
        expect(ArrayTypeMap.deserializer).toHaveBeenCalled();
        expect(parsed.array).toEqual(['deserialized']);

        const plain = mappedTypeWithArrayHandler.toPlainJson(parsed);
        expect(ArrayTypeMap.serializer).toHaveBeenCalled();
        expect(plain.array).toEqual(['serialized']);
    });

    it('works on arrays', () => {
        @jsonObject()
        class MappedTypeWithArray {

            @jsonArrayMember(() => CustomType)
            array: Array<CustomType>;
        }

        const CustomTypeMap = {
            deserializer: json => new CustomType(json),
            serializer: value => value.value,
        };
        decoratedJson.mapType(CustomType, CustomTypeMap);
        const mappedTypeWithArrayHandler = decoratedJson.type(MappedTypeWithArray);

        spyOn(CustomTypeMap, 'serializer').and.callThrough();
        spyOn(CustomTypeMap, 'deserializer').and.callThrough();
        const parsed = mappedTypeWithArrayHandler.parse({array: [1, 5]});
        expect(CustomTypeMap.deserializer).toHaveBeenCalled();
        expect(parsed.array.map(c => c.value)).toEqual([1, 5]);

        const plain = mappedTypeWithArrayHandler.toPlainJson(parsed);
        expect(CustomTypeMap.serializer).toHaveBeenCalled();
        expect(plain.array).toEqual([1, 5]);
    });
});
