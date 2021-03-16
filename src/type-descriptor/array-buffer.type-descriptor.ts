import {arrayBufferToString, createArrayBufferFromString} from '../util/buffer.util';
import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

export class ArrayBufferTypeDescriptor
    extends SimpleTypeDescriptor<ArrayBuffer, string | null | undefined> {

    constructor() {
        super(ArrayBuffer);
    }

    fromJson(
        context: ConversionContext<string | any | null | undefined>,
    ): ArrayBuffer | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        if (typeof context.source !== 'string') {
            this.throwTypeMismatchError(context);
        }
        return createArrayBufferFromString(context.source);
    }

    toJson(context: ConversionContext<ArrayBuffer | null | undefined>): string | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        return arrayBufferToString(context.source);
    }
}
