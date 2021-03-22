import {arrayBufferToString, createArrayBufferFromString} from '../util/buffer.util';
import {ConversionContext} from './converter';
import {SimpleConverter} from './simple.converter';

export class ArrayBufferConverter
    extends SimpleConverter<ArrayBuffer, string | null | undefined> {

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
            this.throwTypeMismatchError({
                ...context,
                expectedType: 'String',
            });
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
