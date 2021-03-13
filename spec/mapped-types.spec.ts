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
            fromJson: json => new CustomType(json),
            toJson: value => value?.value,
        });

        const mappedTypesSpecHandler = decoratedJson.type(MappedTypesSpec);

        it('parses', () => {
            const result = mappedTypesSpecHandler.parse(testData);

            expect(result.one).toBeInstanceOf(CustomType);
            expect(result.one.hasSucceeded()).toBeTrue();
            expect(result.two).toBeInstanceOf(CustomType);
            expect(result.two.hasSucceeded()).toBeTrue();
        });

        it('converts to JSON', () => {
            const test = new MappedTypesSpec();
            test.one = new CustomType(1);
            test.two = new CustomType(2);
            const result = mappedTypesSpecHandler.toPlainJson(test);

            expect(result).toEqual(testData);
        });
    });

    it('can be overwritten with fromJson/toJson prop', () => {
        const jsonMemberOptions = {
            fromJson: () => new CustomType(0),
            toJson: () => 1,
        };

        const CustomTypeMap = {
            fromJson: (json: any) => new CustomType(json),
            toJson: (value: any) => value.value,
        };

        spyOn(CustomTypeMap, 'toJson').and.callThrough();
        spyOn(jsonMemberOptions, 'toJson').and.callThrough();
        spyOn(CustomTypeMap, 'fromJson').and.callThrough();
        spyOn(jsonMemberOptions, 'fromJson').and.callThrough();

        @jsonObject()
        class OverriddenConverters {
            @jsonMember(jsonMemberOptions)
            overwritten: CustomType;

            @jsonMember()
            simple: CustomType;
        }

        decoratedJson.mapType(CustomType, CustomTypeMap);
        const overriddenTypeHandler = decoratedJson.type(OverriddenConverters);

        const parsed = overriddenTypeHandler.parse({data: 5, simple: 5});
        expect(CustomTypeMap.fromJson).toHaveBeenCalledTimes(1);
        expect(jsonMemberOptions.fromJson).toHaveBeenCalledTimes(1);
        expect(parsed.overwritten.value).toBe(0);
        expect(parsed.simple.value).toBe(5);

        const plain = overriddenTypeHandler.toPlainJson(parsed);
        expect(CustomTypeMap.toJson).toHaveBeenCalledTimes(1);
        expect(jsonMemberOptions.toJson).toHaveBeenCalledTimes(1);
        expect(plain.overwritten).toBe(1);
        expect(plain.simple).toBe(5);
    });

    it('should use default when only mapping fromJson', () => {
        @jsonObject()
        class OnlyFromJson {
            @jsonMember()
            date: Date;
        }

        decoratedJson.mapType<Date, Date>(Date, {
            fromJson: value => new Date(new Date(value).setFullYear(3000)),
        });
        const onlyFromJsonHandler = decoratedJson.type(OnlyFromJson);
        const parsed = onlyFromJsonHandler.parse({date: date2000});

        expect(parsed.date.toISOString()).toEqual(date3000);
        expect(onlyFromJsonHandler.toPlainJson(parsed).date.toString())
            .toEqual(new Date(date3000).toString());
    });

    it('should use default when only mapping toJson', () => {
        @jsonObject()
        class OnlyToJson {
            @jsonMember()
            date: Date;
        }

        decoratedJson.mapType(Date, {
            toJson: value => new Date(value!.setFullYear(3000)).toISOString(),
        });
        const OnlyToJsonHandler = decoratedJson.type(OnlyToJson);

        const test = new OnlyToJson();
        test.date = new Date(date2000);
        const result = OnlyToJsonHandler.toPlainJson(test);

        expect(result).toEqual({date: date3000});
        expect(OnlyToJsonHandler.parse({date: date2000}).date.toISOString()).toEqual(date2000);
    });

    it('should handle mapping arrays', () => {
        @jsonObject()
        class MappedTypeWithArray {

            @jsonArrayMember(() => String)
            array: Array<string>;
        }

        const ArrayTypeMap = {
            fromJson: () => ['object'],
            toJson: () => ['json'],
        };

        decoratedJson.mapType(Array, ArrayTypeMap);

        const mappedTypeWithArrayHandler = decoratedJson.type(MappedTypeWithArray);

        spyOn(ArrayTypeMap, 'toJson').and.callThrough();
        spyOn(ArrayTypeMap, 'fromJson').and.callThrough();
        const parsed = mappedTypeWithArrayHandler.parse({array: ['hello']});
        expect(ArrayTypeMap.fromJson).toHaveBeenCalled();
        expect(parsed.array).toEqual(['object']);

        const plain = mappedTypeWithArrayHandler.toPlainJson(parsed);
        expect(ArrayTypeMap.toJson).toHaveBeenCalled();
        expect(plain.array).toEqual(['json']);
    });

    it('works on arrays', () => {
        @jsonObject()
        class MappedTypeWithArray {

            @jsonArrayMember(() => CustomType)
            array: Array<CustomType>;
        }

        const CustomTypeMap = {
            fromJson: (json: any) => new CustomType(json),
            toJson: (value: any) => value.value,
        };
        decoratedJson.mapType(CustomType, CustomTypeMap);
        const mappedTypeWithArrayHandler = decoratedJson.type(MappedTypeWithArray);

        spyOn(CustomTypeMap, 'toJson').and.callThrough();
        spyOn(CustomTypeMap, 'fromJson').and.callThrough();
        const parsed = mappedTypeWithArrayHandler.parse({array: [1, 5]});
        expect(CustomTypeMap.fromJson).toHaveBeenCalled();
        expect(parsed.array.map(c => c.value)).toEqual([1, 5]);

        const plain = mappedTypeWithArrayHandler.toPlainJson(parsed);
        expect(CustomTypeMap.toJson).toHaveBeenCalled();
        expect(plain.array).toEqual([1, 5]);
    });
});
