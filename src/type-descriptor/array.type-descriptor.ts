import {ListTypeDescriptor} from './list.type-descriptor';
import {
    ConversionContext,
    Typelike,
} from './type-descriptor';
import {ensureTypeDescriptor} from './type-descriptor.utils';

export class ArrayTypeDescriptor<Class extends Object> extends ListTypeDescriptor<Class> {

    fromJson(
        context: ConversionContext<Array<any> | null | undefined>,
    ): Array<Class | null | undefined> | null | undefined {
        if (context.sourceObject == null) {
            return context.sourceObject;
        }

        if (!Array.isArray(context.sourceObject)) {
            this.throwTypeMismatchError({
                context,
                expectedSourceType: 'an array',
            });
        }

        return context.sourceObject.map((element, i) => {
            return this.type.fromJson(
                {
                    ...context,
                    path: `${context.path}[${i}]`,
                    sourceObject: element,
                },
            );
        });
    }

    /**
     * Performs the conversion of an array of typed objects (or primitive values) to an array of
     * simple javascript objects (or primitive values).
     */
    toJson(
        context: ConversionContext<Array<Class | null | undefined> | null | undefined>,
    ): Array<any> | null | undefined {
        if (context.sourceObject == null) {
            return context.sourceObject;
        }

        return context.sourceObject.map((element, i) => {
            return this.type.toJson({
                ...context,
                path: `${context.path}[${i}]`,
                sourceObject: element,
            });
        });
    }

    getFriendlyName(): string {
        return `Array<${this.type.getFriendlyName()}`;
    }
}

export function array<T>(elementType: Typelike<T>): ArrayTypeDescriptor<T> {
    return new ArrayTypeDescriptor(ensureTypeDescriptor(elementType));
}
