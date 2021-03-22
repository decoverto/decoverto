import {arrayBufferToString, createArrayBufferFromString} from '../util/buffer.util';
import {ConversionContext} from './converter';
import {SimpleConverter} from './simple.converter';

export class DataViewConverter
    extends SimpleConverter<DataView, string | null | undefined> {

    constructor() {
        super(DataView);
    }

    fromJson(
        context: ConversionContext<string | any | null | undefined>,
    ): DataView | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        if (typeof context.source !== 'string') {
            this.throwTypeMismatchError({
                ...context,
                expectedType: 'String',
            });
        }

        return new DataView(createArrayBufferFromString(context.source));
    }

    toJson(context: ConversionContext<DataView | null | undefined>): string | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        return arrayBufferToString(context.source.buffer);
    }
}
