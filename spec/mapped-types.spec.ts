import {
    array,
    ConversionContext,
    DecoratedJson,
    jsonMember,
    jsonObject,
    TypeDescriptor,
} from '../src';

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
        class CustomTypeDescriptor extends TypeDescriptor<CustomType> {
            fromJson(
                context: ConversionContext<any | null | undefined>,
            ): CustomType {
                return new CustomType(context.source);
            }

            toJson(
                context: ConversionContext<CustomType | null | undefined>,
            ): any | null | undefined {
                return context.source?.value;
            }

            getFriendlyName(): string {
                return 'CustomType';
            }
        }

        decoratedJson = new DecoratedJson();
        decoratedJson.converterMap.set(CustomType, new CustomTypeDescriptor());

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

        class CustomTypeDescriptor extends TypeDescriptor<CustomType> {
            fromJson(
                context: ConversionContext<any | null | undefined>,
            ): CustomType {
                return new CustomType(context.source);
            }

            toJson(
                context: ConversionContext<CustomType | null | undefined>,
            ): any | null | undefined {
                return context.source?.value;
            }

            getFriendlyName(): string {
                return 'CustomType';
            }
        }

        const customTypeDescriptor = new CustomTypeDescriptor();

        spyOn(customTypeDescriptor, 'toJson').and.callThrough();
        spyOn(jsonMemberOptions, 'toJson').and.callThrough();
        spyOn(customTypeDescriptor, 'fromJson').and.callThrough();
        spyOn(jsonMemberOptions, 'fromJson').and.callThrough();

        @jsonObject()
        class OverriddenConverters {
            @jsonMember(jsonMemberOptions)
            overwritten: CustomType;

            @jsonMember()
            simple: CustomType;
        }

        decoratedJson.converterMap.set(CustomType, customTypeDescriptor);
        const overriddenTypeHandler = decoratedJson.type(OverriddenConverters);

        const parsed = overriddenTypeHandler.parse({data: 5, simple: 5});
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(customTypeDescriptor.fromJson).toHaveBeenCalledTimes(1);
        expect(jsonMemberOptions.fromJson).toHaveBeenCalledTimes(1);
        expect(parsed.overwritten.value).toBe(0);
        expect(parsed.simple.value).toBe(5);

        const plain = overriddenTypeHandler.toPlainJson(parsed);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(customTypeDescriptor.toJson).toHaveBeenCalledTimes(1);
        expect(jsonMemberOptions.toJson).toHaveBeenCalledTimes(1);
        expect(plain.overwritten).toBe(1);
        expect(plain.simple).toBe(5);
    });

    it('works on arrays', () => {
        @jsonObject()
        class MappedTypeWithArray {

            @jsonMember(array(() => CustomType))
            array: Array<CustomType>;
        }

        class CustomTypeDescriptor extends TypeDescriptor<CustomType> {
            fromJson(
                context: ConversionContext<any | null | undefined>,
            ): CustomType {
                return new CustomType(context.source);
            }

            toJson(
                context: ConversionContext<CustomType | null | undefined>,
            ): any | null | undefined {
                return context.source?.value;
            }

            getFriendlyName(): string {
                return 'CustomType';
            }
        }

        const customTypeDescriptor = new CustomTypeDescriptor();
        decoratedJson.converterMap.set(CustomType, customTypeDescriptor);
        const mappedTypeWithArrayHandler = decoratedJson.type(MappedTypeWithArray);

        spyOn(customTypeDescriptor, 'toJson').and.callThrough();
        spyOn(customTypeDescriptor, 'fromJson').and.callThrough();
        const parsed = mappedTypeWithArrayHandler.parse({array: [1, 5]});
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(customTypeDescriptor.fromJson).toHaveBeenCalled();
        expect(parsed.array.map(c => c.value)).toEqual([1, 5]);

        const plain = mappedTypeWithArrayHandler.toPlainJson(parsed);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(customTypeDescriptor.toJson).toHaveBeenCalled();
        expect(plain.array).toEqual([1, 5]);
    });
});
