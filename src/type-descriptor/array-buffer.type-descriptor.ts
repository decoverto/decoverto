import {arrayBufferToString, createArrayBufferFromString} from '../util/buffer.util';
import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

export class ArrayBufferTypeDescriptor extends SimpleTypeDescriptor<ArrayBuffer, string> {

    constructor() {
        super(ArrayBuffer);
    }

    fromJson(
        context: ConversionContext<string | any | null | undefined>,
    ): ArrayBuffer | null | undefined {
        if (context.sourceObject == null) {
            return context.sourceObject;
        }

        if (typeof context.sourceObject !== 'string') {
            this.throwTypeMismatchError({
                context,
                expectedSourceType: 'a string',
            });
        }
        return createArrayBufferFromString(context.sourceObject);
    }

    toJson(context: ConversionContext<ArrayBuffer | null | undefined>): string | null | undefined {
        if (context.sourceObject == null) {
            return context.sourceObject;
        }

        return arrayBufferToString(context.sourceObject);
    }
}
