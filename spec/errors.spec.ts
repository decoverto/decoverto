import {jsonMember, jsonObject, TypedJSON} from '../src';

describe('errors', () => {
    class CustomType {
    }

    it('should be thrown when types could not be determined', () => {
        @jsonObject()
        class TestNonDeterminableTypes {

            @jsonMember()
            bar: CustomType;
        }

        const typedJson = new TypedJSON(TestNonDeterminableTypes);
        expect(() => typedJson.parse({bar: 'bar'})).toThrow();
    });
});
