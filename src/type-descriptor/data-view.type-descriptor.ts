import {arrayBufferToString, createArrayBufferFromString} from '../util/buffer.util';
import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

export class DataViewTypeDescriptor extends SimpleTypeDescriptor<DataView, string> {

    constructor() {
        super(DataView);
    }

    fromJson(
        context: ConversionContext<string | any | null | undefined>,
    ): DataView | null | undefined {
        if (context.sourceObject == null) {
            return null;
        }

        if (typeof context.sourceObject !== 'string') {
            this.throwTypeMismatchError({
                context,
                expectedSourceType: 'a string',
            });
        }
        return new DataView(createArrayBufferFromString(context.sourceObject));
    }

    toJson(context: ConversionContext<DataView | null | undefined>): string | null | undefined {
        if (context.sourceObject == null) {
            return context.sourceObject;
        }

        return arrayBufferToString(context.sourceObject.buffer);
    }
}
