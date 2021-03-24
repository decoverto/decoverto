import {ConversionContext} from './converter';
import {SimpleConverter} from './simple.converter';

/**
 * Passes types without modification for both toInstance and toPlain but errors if the type of the
 * source does not match the expected type. E.g. a number was expected but a string received.
 */
export class DirectConverter extends SimpleConverter {

    toInstance(context: ConversionContext<any>): any {
        this.errorOnTypeMismatch(context);
        return context.source;
    }

    toPlain(context: ConversionContext<any>): any {
        this.errorOnTypeMismatch(context);
        return context.source;
    }

    private errorOnTypeMismatch(context: ConversionContext<any>) {
        if (context.source == null) {
            return null;
        }

        if (context.source.constructor !== this.type) {
            this.throwTypeMismatchError(context);
        }
    }
}
