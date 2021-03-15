import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

/**
 * Passes types without modification for both fromJson and toJson but errors if the type of the
 * sourceObject does not match the expected type. E.g. a number was expected but a string received.
 */
export class DirectTypeDescriptor extends SimpleTypeDescriptor {

    fromJson(context: ConversionContext<any>): any {
        this.errorOnTypeMismatch(context);
        return context.sourceObject;
    }

    toJson(context: ConversionContext<any>): any {
        this.errorOnTypeMismatch(context);
        return context.sourceObject;
    }

    private errorOnTypeMismatch(context: ConversionContext<any>) {
        if (context.sourceObject == null) {
            return null;
        }

        if (context.sourceObject.constructor !== this.type) {
            this.throwTypeMismatchError({
                context,
                expectedSourceType: this.getFriendlyName(),
            });
        }
    }
}
