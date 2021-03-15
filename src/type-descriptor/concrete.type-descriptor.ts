import {FromJson} from '../from-json';
import {ToJson} from '../to-json';
import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext, TypeDescriptor} from './type-descriptor';

/**
 * A concrete type descriptor converts instances of user defined classes.
 */
export class ConcreteTypeDescriptor<Class extends Object = any, Json = any>
    extends SimpleTypeDescriptor<Class, Json> {

    fromJson(context: ConversionContext<Json | null | undefined>): Class | null | undefined {
        const {sourceObject, path} = context;

        if (sourceObject === null) {
            return null;
        } else if (sourceObject === undefined) {
            return undefined;
        }

        const converter = this.getConverter(context);

        if (converter === undefined) {
            if (typeof sourceObject !== 'object') {
                throw new TypeError(`Could not determine how to convert '${path}' from JSON. Type: \
${this.getFriendlyName()}.`);
            }

            // Some unfortunate 'as any' casts are required. We don't quite know whether
            // sourceObject has the correct type, but it __should__ be.
            return FromJson.convertAsObject({
                ...context,
                sourceObject: sourceObject as any,
                typeDescriptor: this,
            }) as unknown as any;
        } else {
            return converter.fromJson(context);
        }
    }

    toJson(context: ConversionContext<Class | null | undefined>): Json | null | undefined {
        const {sourceObject, path} = context;

        if (sourceObject === null) {
            return null;
        } else if (sourceObject === undefined) {
            return undefined;
        }

        const converter = this.getConverter(context);

        if (converter === undefined) {
            if (typeof sourceObject !== 'object') {
                throw new TypeError(`Could not determine how to convert '${path}' to JSON. Type: \
${this.getFriendlyName()}.`);
            }

            return ToJson.convertAsObject({
                ...context,
                sourceObject: sourceObject,
                typeDescriptor: this,
            }) as any; // Cast to any since generic Json parameter could be anything
        } else {
            return converter.toJson(context);
        }
    }

    private getConverter(context: ConversionContext<any>): TypeDescriptor | undefined {
        return context.typeMap.get(this.type);
    }
}
