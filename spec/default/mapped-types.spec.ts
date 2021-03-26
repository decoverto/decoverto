import test from 'ava';
import * as sinon from 'sinon';

import {
    array,
    ConversionContext,
    Converter,
    Decoverto,
    model,
    property,
    SimpleConverter,
} from '../../src';
import {setAvaContext} from '../helpers/ava.helper';

class CustomType {
    value: any;

    constructor(value: any) {
        this.value = value;
    }
}

@model()
class MappedTypesSpec {

    @property()
    property: CustomType;
}

class CustomConverter extends Converter<CustomType> {
    toInstance(
        context: ConversionContext<any | null | undefined>,
    ): CustomType {
        return new CustomType(context.source);
    }

    toPlain(
        context: ConversionContext<CustomType | null | undefined>,
    ): any | null | undefined {
        return context.source?.value;
    }

    getFriendlyName(): string {
        return 'CustomType';
    }
}

setAvaContext<{decoverto: Decoverto}>(test);

test.beforeEach(t => {
    t.context.decoverto = new Decoverto();
});

test('Mapped types are used when converting from JSON', t => {
    t.context.decoverto.converterMap.set(CustomType, new CustomConverter());
    const result = t.context.decoverto.type(MappedTypesSpec).plainToInstance({property: 1});

    t.true(result.property instanceof CustomType);
    t.is(result.property.value, 1);
});

test('Mapped types are used when converting to JSON', t => {
    t.context.decoverto.converterMap.set(CustomType, new CustomConverter());
    const testSubject = new MappedTypesSpec();
    testSubject.property = new CustomType(1);
    const result = t.context.decoverto.type(MappedTypesSpec).instanceToPlain(testSubject);

    t.deepEqual(result, {property: 1});
});

test('Mapped types are used when value is null', t => {
    const converter = new CustomConverter();
    const toInstanceSpy = sinon.spy(converter, 'toInstance');
    const toPlainSpy = sinon.spy(converter, 'toPlain');
    t.context.decoverto.converterMap.set(CustomType, converter);

    const toInstanceResult = t.context.decoverto
        .type(MappedTypesSpec)
        .plainToInstance({property: null});
    t.true(toInstanceResult.property instanceof CustomType);
    t.is(toInstanceResult.property.value, null);
    t.is(toInstanceSpy.callCount, 1);

    const toPlainSubject = new MappedTypesSpec();
    toPlainSubject.property = new CustomType(null);
    const toPlainResult = t.context.decoverto
        .type(MappedTypesSpec)
        .instanceToPlain(toPlainSubject);
    t.is(toPlainResult.property, null);
    t.is(toPlainSpy.callCount, 1);
    t.is(toInstanceSpy.callCount, 1);
});

test('Mapped types are used when value is undefined', t => {
    @model()
    class MappedTypUndefinedSpec {

        @property()
        property: CustomType;
    }

    const converter = new CustomConverter();
    const toInstanceSpy = sinon.spy(converter, 'toInstance');
    const toPlainSpy = sinon.spy(converter, 'toPlain');
    t.context.decoverto.converterMap.set(CustomType, converter);

    const toInstanceResult = t.context.decoverto
        .type(MappedTypUndefinedSpec)
        .plainToInstance({property: undefined});
    t.true(toInstanceResult.property instanceof CustomType);
    t.is(toInstanceResult.property.value, undefined);
    t.is(toInstanceSpy.callCount, 1);

    const toPlainSubject = new MappedTypUndefinedSpec();
    toPlainSubject.property = new CustomType(undefined);
    const toPlainResult = t.context.decoverto
        .type(MappedTypUndefinedSpec)
        .instanceToPlain(toPlainSubject);
    t.is(toPlainResult.property, undefined);
    t.is(toPlainSpy.callCount, 1);
    t.is(toInstanceSpy.callCount, 1);
});

test('Mapped types can be overwritten with toInstance/toPlain property on @property', t => {
    const propertyOptions = {
        toInstance: () => new CustomType(0),
        toPlain: () => 1,
    };

    const converter = new CustomConverter();
    t.context.decoverto.converterMap.set(CustomType, converter);

    const customConverterToInstance = sinon.spy(converter, 'toInstance');
    const customConverterToPlain = sinon.spy(converter, 'toPlain');
    const propertyOptionsToInstance = sinon.spy(propertyOptions, 'toInstance');
    const propertyOptionsToPlain = sinon.spy(propertyOptions, 'toPlain');

    @model()
    class OverriddenConverters {
        @property(propertyOptions)
        overwritten: CustomType;

        @property()
        simple: CustomType;
    }

    const overriddenTypeHandler = t.context.decoverto.type(OverriddenConverters);

    const parsed = overriddenTypeHandler.plainToInstance({data: 5, simple: 5});
    t.is(customConverterToInstance.callCount, 1);
    t.is(customConverterToPlain.callCount, 0);
    t.is(propertyOptionsToInstance.callCount, 1);
    t.is(propertyOptionsToPlain.callCount, 0);
    t.is(parsed.overwritten.value, 0);
    t.is(parsed.simple.value, 5);

    const plain = overriddenTypeHandler.instanceToPlain(parsed);
    t.is(customConverterToInstance.callCount, 1);
    t.is(customConverterToPlain.callCount, 1);
    t.is(propertyOptionsToInstance.callCount, 1);
    t.is(propertyOptionsToPlain.callCount, 1);
    t.is(plain.overwritten, 1);
    t.is(plain.simple, 5);
});

test('Mapped types work on array', t => {
    @model()
    class MappedTypeWithArray {

        @property(array(() => CustomType))
        array: Array<CustomType>;
    }

    const customConverter = new CustomConverter();
    t.context.decoverto.converterMap.set(CustomType, customConverter);
    const mappedTypeWithArrayHandler = t.context.decoverto.type(MappedTypeWithArray);

    const customConverterToPlain = sinon.spy(customConverter, 'toPlain');
    const customConverterToInstance = sinon.spy(customConverter, 'toInstance');
    const parsed = mappedTypeWithArrayHandler.plainToInstance({array: [1, 5]});
    t.is(customConverterToInstance.callCount, 2);
    t.deepEqual(parsed.array.map(c => c.value), [1, 5]);

    const plain = mappedTypeWithArrayHandler.instanceToPlain(parsed);
    t.is(customConverterToPlain.callCount, 2);
    t.deepEqual(plain.array, [1, 5]);
});

test('Mapped types work on .type(String)', t => {
    class StringConverterTest extends SimpleConverter<string, string> {
        toInstance(context: ConversionContext<string>): string | null | undefined {
            return 'toInstance';
        }

        toPlain(context: ConversionContext<string | null | undefined>): string {
            return 'toPlain';
        }
    }

    t.context.decoverto.converterMap.set(String, new StringConverterTest(String as any));
    t.is(t.context.decoverto.type(String).plainToInstance('hmmm'), 'toInstance');
});
