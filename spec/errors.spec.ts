import {DecoratedJson, jsonMember, jsonObject} from '../src';

const decoratedJson = new DecoratedJson();

describe('errors', () => {
    class CustomType {
    }

    it('should be thrown when types could not be determined', () => {
        @jsonObject()
        class TestNonDeterminableTypes {

            @jsonMember()
            bar: CustomType;
        }

        const testNonDeterminableTypesHandler = decoratedJson.type(TestNonDeterminableTypes);
        expect(() => testNonDeterminableTypesHandler.parse({bar: 'bar'})).toThrow();
    });
});
