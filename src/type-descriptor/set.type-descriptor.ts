import {ListTypeDescriptor} from './list.type-descriptor';
import {
    ConversionContext,
    Typelike,
} from './type-descriptor';
import {ensureTypeDescriptor} from './type-descriptor.utils';

export class SetTypeDescriptor<Class extends Object>
    extends ListTypeDescriptor<
        Set<Class | null | undefined> | null | undefined,
        Class | null | undefined
    > {

    fromJson(
        context: ConversionContext<Array<any> | null | undefined>,
    ): Set<Class | null | undefined> | null | undefined {
        if (context.source == null) {
            return null;
        }

        if (!Array.isArray(context.source)) {
            this.throwTypeMismatchError({
                ...context,
                expectedType: `Array<${this.type.getFriendlyName()}>`,
            });
        }

        const resultSet = new Set<Class | null | undefined>();

        context.source.forEach((element, i) => {
            resultSet.add(this.type.fromJson({
                ...context,
                path: `${context.path}[${i}]`,
                source: element,
            }));
        });

        return resultSet;
    }

    /**
     * Performs the conversion of a set of typed objects (or primitive values) into an array
     * of simple javascript objects.
     */
    toJson(context: ConversionContext<Set<Class | null | undefined> | null | undefined>) {
        if (context.source == null) {
            return null;
        }

        if (!(context.source as any instanceof Set)) {
            this.throwTypeMismatchError(context);
        }

        context.path += '[]';
        const resultArray: Array<any> = [];

        context.source.forEach(element => {
            resultArray.push(this.type.toJson({
                ...context,
                source: element,
            }));
        });

        return resultArray;
    }

    getFriendlyName(): string {
        return `Set<${this.type.getFriendlyName()}>`;
    }
}

export function set<T>(elementType: Typelike<T>): SetTypeDescriptor<T> {
    return new SetTypeDescriptor(ensureTypeDescriptor(elementType));
}
