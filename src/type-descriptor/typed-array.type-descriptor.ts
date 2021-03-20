import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

export class TypedArrayTypeDescriptor extends SimpleTypeDescriptor {

    fromJson(context: ConversionContext<any | null>): any | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        const {source} = context;

        if (!Array.isArray(source)) {
            this.throwTypeMismatchError({
                ...context,
                expectedType: 'a numeric array',
            });
        }

        return new this.type(source);
    }

    toJson(context: ConversionContext<any | null | undefined>): any | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        if (!(context.source instanceof this.type)) {
            this.throwTypeMismatchError(context);
        }

        return Array.from(context.source);
    }
}
