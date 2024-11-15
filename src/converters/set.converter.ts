import {
    ConversionContext,
    Typelike,
} from './converter';
import {toConverter} from './converter.utils';
import {ListConverter} from './list.converter';

export class SetConverter<Class extends {}>
    extends ListConverter<
        Set<Class | null | undefined> | null | undefined,
        Class | null | undefined
    > {

    toInstance(
        context: ConversionContext<Array<any> | null | undefined>,
    ): Set<Class | null | undefined> | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        if (!Array.isArray(context.source)) {
            this.throwTypeMismatchError({
                ...context,
                expectedType: `Array<${this.type.getFriendlyName()}>`,
            });
        }

        const resultSet = new Set<Class | null | undefined>();

        context.source.forEach((element, i) => {
            resultSet.add(this.type.toInstance({
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
    toPlain(context: ConversionContext<Set<Class | null | undefined> | null | undefined>) {
        if (context.source == null) {
            return context.source;
        }

        if (!(context.source as any instanceof Set)) {
            this.throwTypeMismatchError(context);
        }

        context.path += '[]';
        const resultArray: Array<any> = [];

        context.source.forEach(element => {
            resultArray.push(this.type.toPlain({
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

export function set<T extends {}>(elementType: Typelike<T>): SetConverter<T> {
    return new SetConverter(toConverter(elementType));
}
