import test from 'ava';
import * as sinon from 'sinon';

import {
    array,
    ConversionContext,
    Converter,
    DecoratedJson,
    jsonObject,
    jsonProperty,
    SimpleConverter,
} from '../../src';
import {setAvaContext} from '../helpers/ava.helper';

class CustomType {
    value: any;

    constructor(value: any) {
        this.value = value;
    }
}

@jsonObject()
class MappedTypesSpec {

    @jsonProperty()
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

setAvaContext<{decoratedJson: DecoratedJson}>(test);

test.beforeEach(t => {
    t.context.decoratedJson = new DecoratedJson();
});

test('Mapped types are used when converting from JSON', t => {
    t.context.decoratedJson.converterMap.set(CustomType, new CustomConverter());
    const result = t.context.decoratedJson.type(MappedTypesSpec).plainToInstance({property: 1});

    t.true(result.property instanceof CustomType);
    t.is(result.property.value, 1);
});

test('Mapped types are used when converting to JSON', t => {
    t.context.decoratedJson.converterMap.set(CustomType, new CustomConverter());
    const testSubject = new MappedTypesSpec();
    testSubject.property = new CustomType(1);
    const result = t.context.decoratedJson.type(MappedTypesSpec).instanceToPlain(testSubject);

    t.deepEqual(result, {property: 1});
});

test('Mapped types are used when value is null', t => {
    const converter = new CustomConverter();
    const fromJsonSpy = sinon.spy(converter, 'toInstance');
    const toJsonSpy = sinon.spy(converter, 'toPlain');
    t.context.decoratedJson.converterMap.set(CustomType, converter);

    const fromJsonResult = t.context.decoratedJson
        .type(MappedTypesSpec)
        .plainToInstance({property: null});
    t.true(fromJsonResult.property instanceof CustomType);
    t.is(fromJsonResult.property.value, null);
    t.is(fromJsonSpy.callCount, 1);

    const toJsonSubject = new MappedTypesSpec();
    toJsonSubject.property = new CustomType(null);
    const toJsonResult = t.context.decoratedJson
        .type(MappedTypesSpec)
        .instanceToPlain(toJsonSubject);
    t.is(toJsonResult.property, null);
    t.is(toJsonSpy.callCount, 1);
    t.is(fromJsonSpy.callCount, 1);
});

test('Mapped types are used when value is undefined', t => {
    @jsonObject()
    class MappedTypUndefinedSpec {

        @jsonProperty()
        property: CustomType;
    }

    const converter = new CustomConverter();
    const fromJsonSpy = sinon.spy(converter, 'toInstance');
    const toJsonSpy = sinon.spy(converter, 'toPlain');
    t.context.decoratedJson.converterMap.set(CustomType, converter);

    const fromJsonResult = t.context.decoratedJson
        .type(MappedTypUndefinedSpec)
        .plainToInstance({property: undefined});
    t.true(fromJsonResult.property instanceof CustomType);
    t.is(fromJsonResult.property.value, undefined);
    t.is(fromJsonSpy.callCount, 1);

    const toJsonSubject = new MappedTypUndefinedSpec();
    toJsonSubject.property = new CustomType(undefined);
    const toJsonResult = t.context.decoratedJson
        .type(MappedTypUndefinedSpec)
        .instanceToPlain(toJsonSubject);
    t.is(toJsonResult.property, undefined);
    t.is(toJsonSpy.callCount, 1);
    t.is(fromJsonSpy.callCount, 1);
});

test('Mapped types can be overwritten with toInstance/toPlain property on @jsonProperty', t => {
    const jsonPropertyOptions = {
        fromJson: () => new CustomType(0),
        toJson: () => 1,
    };

    const converter = new CustomConverter();
    t.context.decoratedJson.converterMap.set(CustomType, converter);

    const customConverterFromJson = sinon.spy(converter, 'toInstance');
    const customConverterToJson = sinon.spy(converter, 'toPlain');
    const jsonPropertyOptionsFromJson = sinon.spy(jsonPropertyOptions, 'fromJson');
    const jsonPropertyOptionsToJson = sinon.spy(jsonPropertyOptions, 'toJson');

    @jsonObject()
    class OverriddenConverters {
        @jsonProperty(jsonPropertyOptions)
        overwritten: CustomType;

        @jsonProperty()
        simple: CustomType;
    }

    const overriddenTypeHandler = t.context.decoratedJson.type(OverriddenConverters);

    const parsed = overriddenTypeHandler.plainToInstance({data: 5, simple: 5});
    t.is(customConverterFromJson.callCount, 1);
    t.is(customConverterToJson.callCount, 0);
    t.is(jsonPropertyOptionsFromJson.callCount, 1);
    t.is(jsonPropertyOptionsToJson.callCount, 0);
    t.is(parsed.overwritten.value, 0);
    t.is(parsed.simple.value, 5);

    const plain = overriddenTypeHandler.instanceToPlain(parsed);
    t.is(customConverterFromJson.callCount, 1);
    t.is(customConverterToJson.callCount, 1);
    t.is(jsonPropertyOptionsFromJson.callCount, 1);
    t.is(jsonPropertyOptionsToJson.callCount, 1);
    t.is(plain.overwritten, 1);
    t.is(plain.simple, 5);
});

test('Mapped types work on array', t => {
    @jsonObject()
    class MappedTypeWithArray {

        @jsonProperty(array(() => CustomType))
        array: Array<CustomType>;
    }

    const customConverter = new CustomConverter();
    t.context.decoratedJson.converterMap.set(CustomType, customConverter);
    const mappedTypeWithArrayHandler = t.context.decoratedJson.type(MappedTypeWithArray);

    const customConverterToJson = sinon.spy(customConverter, 'toPlain');
    const customConverterFromJson = sinon.spy(customConverter, 'toInstance');
    const parsed = mappedTypeWithArrayHandler.plainToInstance({array: [1, 5]});
    t.is(customConverterFromJson.callCount, 2);
    t.deepEqual(parsed.array.map(c => c.value), [1, 5]);

    const plain = mappedTypeWithArrayHandler.instanceToPlain(parsed);
    t.is(customConverterToJson.callCount, 2);
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

    t.context.decoratedJson.converterMap.set(String, new StringConverterTest(String as any));
    t.is(t.context.decoratedJson.type(String).plainToInstance('hmmm'), 'toInstance');
});
