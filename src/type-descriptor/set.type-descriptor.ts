import {isValueDefined} from '../helpers';
import {ListTypeDescriptor} from './list.type-descriptor';
import {
    ConversionContext,
    Typelike,
} from './type-descriptor';
import {ensureTypeDescriptor} from './type-descriptor.utils';

export class SetTypeDescriptor<Class extends Object> extends ListTypeDescriptor<Class> {
    fromJson(
        context: ConversionContext<Array<any> | null | undefined>,
    ): Set<Class | null | undefined> | null | undefined {
        if (context.source == null) {
            return null;
        }

        if (!Array.isArray(context.source)) {
            throw new TypeError(this.throwTypeMismatchError({
                context,
                expectedSourceType: 'an array',
            }));
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
    toJson(context: ConversionContext<Array<Class | null | undefined> | null | undefined>) {
        if (context.source == null) {
            return null;
        }

        context.path += '[]';
        const resultArray: Array<any> = [];

        // Convert each element of the set, and put it into an array.
        context.source.forEach((element) => {
            const resultElement = this.type.toJson({
                ...context,
                source: element,
            });

            // Add to output if the source element was undefined, OR the converted element is
            // defined.
            if (!isValueDefined(element) || isValueDefined(resultElement)) {
                resultArray.push(resultElement);
            }
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
