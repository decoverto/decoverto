import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

export class TypedArrayTypeDescriptor extends SimpleTypeDescriptor {

    fromJson(context: ConversionContext<any | null>): any | null | undefined {
        if (context.sourceObject == null) {
            return null;
        }

        const {sourceObject} = context;

        if (Array.isArray(sourceObject) && sourceObject.every(elem => !isNaN(elem))) {
            if ([Float32Array, Float64Array].includes(this.type as any)) {
                return new this.type(sourceObject);
            } else {
                return new this.type(sourceObject.map(value => Math.trunc(value)));
            }
        }

        this.throwTypeMismatchError({
            context,
            expectedSourceType: 'a numeric array',
        });
    }

    toJson(context: ConversionContext<any | null | undefined>): any | null | undefined {
        if (context.sourceObject == null) {
            return null;
        }

        return Array.from(context.sourceObject);
    }
}
