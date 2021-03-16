import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

/**
 * Passes types without modification for both fromJson and toJson but errors if the type of the
 * source does not match the expected type. E.g. a number was expected but a string received.
 */
export class DirectTypeDescriptor extends SimpleTypeDescriptor {

    fromJson(context: ConversionContext<any>): any {
        this.errorOnTypeMismatch(context);
        return context.source;
    }

    toJson(context: ConversionContext<any>): any {
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
