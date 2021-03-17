import test from 'ava';
import * as sinon from 'sinon';

import {
    array,
    ConversionContext,
    DecoratedJson,
    jsonObject,
    jsonProperty,
    TypeDescriptor,
} from '../src';
import {setAvaContext} from './helpers/ava.helper';

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

    @jsonProperty()
    one: CustomType;

    @jsonProperty()
    two: CustomType;
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

const testData = {
    one: 1,
    two: 2,
};

test('Mapped types are used when converting from JSON', t => {
    t.context.decoratedJson.converterMap.set(CustomType, new CustomTypeDescriptor());
    const result = t.context.decoratedJson.type(MappedTypesSpec).parse(testData);

    t.true(result.one instanceof CustomType);
    t.true(result.one.hasSucceeded());
    t.true(result.two instanceof CustomType);
    t.true(result.two.hasSucceeded());
});

test('Mapped types are used when converting to JSON', t => {
    t.context.decoratedJson.converterMap.set(CustomType, new CustomTypeDescriptor());
    const testSubject = new MappedTypesSpec();
    testSubject.one = new CustomType(1);
    testSubject.two = new CustomType(2);
    const result = t.context.decoratedJson.type(MappedTypesSpec).toPlainJson(testSubject);

    t.deepEqual(result, testData);
});

test('Mapped types can be overwritten with fromJson/toJson property on @jsonProperty', t => {
    const jsonPropertyOptions = {
        fromJson: () => new CustomType(0),
        toJson: () => 1,
    };

    const customTypeDescriptor = new CustomTypeDescriptor();
    t.context.decoratedJson.converterMap.set(CustomType, customTypeDescriptor);

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
    t.context.decoratedJson.converterMap.set(CustomType, customTypeDescriptor);
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
