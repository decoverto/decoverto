import test from 'ava';
import * as sinon from 'sinon';

import {
    array,
    ConversionContext,
    DecoratedJson,
    jsonObject,
    jsonProperty,
    TypeDescriptor,
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

setAvaContext<{decoratedJson: DecoratedJson}>(test);

test.beforeEach(t => {
    t.context.decoratedJson = new DecoratedJson();
});

test('Mapped types are used when converting from JSON', t => {
    t.context.decoratedJson.typeMap.set(CustomType, new CustomTypeDescriptor());
    const result = t.context.decoratedJson.type(MappedTypesSpec).parse({property: 1});

    t.true(result.property instanceof CustomType);
    t.is(result.property.value, 1);
});

test('Mapped types are used when converting to JSON', t => {
    t.context.decoratedJson.typeMap.set(CustomType, new CustomTypeDescriptor());
    const testSubject = new MappedTypesSpec();
    testSubject.property = new CustomType(1);
    const result = t.context.decoratedJson.type(MappedTypesSpec).toPlainJson(testSubject);

    t.deepEqual(result, {property: 1});
});

test('Mapped types are used when value is null', t => {
    const typeDescriptor = new CustomTypeDescriptor();
    const fromJsonSpy = sinon.spy(typeDescriptor, 'fromJson');
    const toJsonSpy = sinon.spy(typeDescriptor, 'toJson');
    t.context.decoratedJson.typeMap.set(CustomType, typeDescriptor);

    const fromJsonResult = t.context.decoratedJson
        .type(MappedTypesSpec)
        .parse({property: null});
    t.true(fromJsonResult.property instanceof CustomType);
    t.is(fromJsonResult.property.value, null);
    t.is(fromJsonSpy.callCount, 1);

    const toJsonSubject = new MappedTypesSpec();
    toJsonSubject.property = new CustomType(null);
    const toJsonResult = t.context.decoratedJson
        .type(MappedTypesSpec)
        .toPlainJson(toJsonSubject);
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

    const typeDescriptor = new CustomTypeDescriptor();
    const fromJsonSpy = sinon.spy(typeDescriptor, 'fromJson');
    const toJsonSpy = sinon.spy(typeDescriptor, 'toJson');
    t.context.decoratedJson.typeMap.set(CustomType, typeDescriptor);

    const fromJsonResult = t.context.decoratedJson
        .type(MappedTypUndefinedSpec)
        .parse({property: undefined});
    t.true(fromJsonResult.property instanceof CustomType);
    t.is(fromJsonResult.property.value, undefined);
    t.is(fromJsonSpy.callCount, 1);

    const toJsonSubject = new MappedTypUndefinedSpec();
    toJsonSubject.property = new CustomType(undefined);
    const toJsonResult = t.context.decoratedJson
        .type(MappedTypUndefinedSpec)
        .toPlainJson(toJsonSubject);
    t.is(toJsonResult.property, undefined);
    t.is(toJsonSpy.callCount, 1);
    t.is(fromJsonSpy.callCount, 1);
});

test('Mapped types can be overwritten with fromJson/toJson property on @jsonProperty', t => {
    const jsonPropertyOptions = {
        fromJson: () => new CustomType(0),
        toJson: () => 1,
    };

    const customTypeDescriptor = new CustomTypeDescriptor();
    t.context.decoratedJson.typeMap.set(CustomType, customTypeDescriptor);

    const customTypeDescriptorFromJson = sinon.spy(customTypeDescriptor, 'fromJson');
    const customTypeDescriptorToJson = sinon.spy(customTypeDescriptor, 'toJson');
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

    const parsed = overriddenTypeHandler.parse({data: 5, simple: 5});
    t.is(customTypeDescriptorFromJson.callCount, 1);
    t.is(customTypeDescriptorToJson.callCount, 0);
    t.is(jsonPropertyOptionsFromJson.callCount, 1);
    t.is(jsonPropertyOptionsToJson.callCount, 0);
    t.is(parsed.overwritten.value, 0);
    t.is(parsed.simple.value, 5);

    const plain = overriddenTypeHandler.toPlainJson(parsed);
    t.is(customTypeDescriptorFromJson.callCount, 1);
    t.is(customTypeDescriptorToJson.callCount, 1);
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

    const customTypeDescriptor = new CustomTypeDescriptor();
    t.context.decoratedJson.typeMap.set(CustomType, customTypeDescriptor);
    const mappedTypeWithArrayHandler = t.context.decoratedJson.type(MappedTypeWithArray);

    const customTypeDescriptorToJson = sinon.spy(customTypeDescriptor, 'toJson');
    const customTypeDescriptorFromJson = sinon.spy(customTypeDescriptor, 'fromJson');
    const parsed = mappedTypeWithArrayHandler.parse({array: [1, 5]});
    t.is(customTypeDescriptorFromJson.callCount, 2);
    t.deepEqual(parsed.array.map(c => c.value), [1, 5]);

    const plain = mappedTypeWithArrayHandler.toPlainJson(parsed);
    t.is(customTypeDescriptorToJson.callCount, 2);
    t.deepEqual(plain.array, [1, 5]);
});
