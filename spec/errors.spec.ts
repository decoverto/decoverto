import {DecoratedJson, jsonObject, jsonProperty} from '../src';

const decoratedJson = new DecoratedJson();

describe('errors', () => {
    class CustomType {
    }

    it('should be thrown when types could not be determined', () => {
        @jsonObject()
        class TestNonDeterminableTypes {

            @jsonProperty()
            bar: CustomType;
        }

        const testNonDeterminableTypesHandler = decoratedJson.type(TestNonDeterminableTypes);
        expect(() => testNonDeterminableTypesHandler.parse({bar: 'bar'})).toThrow();
    });

    describe('should be thrown when type differs', () => {
        describe('on direct type descriptor', () => {
            @jsonObject()
            class DirectTypeMismatch {
                @jsonProperty(() => String)
                test: any;

                constructor(
                    test: any,
                ) {
                    this.test = test;
                }
            }

            const typeHandler = decoratedJson.type(DirectTypeMismatch);

            it('on from JSON', () => {
                expect(() => typeHandler.parse({test: 15})).toThrowError(`Got invalid value at \
DirectTypeMismatch.test. Received Number, expected String.`);
            });

            it('on to JSON', () => {
                expect(() => typeHandler.toPlainJson(new DirectTypeMismatch(15))).toThrow();
            });
        });
    });
});
