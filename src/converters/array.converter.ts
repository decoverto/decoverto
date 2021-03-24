import {
    ConversionContext,
    Typelike,
} from './converter';
import {toConverter} from './converter.utils';
import {ListConverter} from './list.converter';

export class ArrayConverter<Class extends Object>
    extends ListConverter<
        Array<Class | null | undefined> | null | undefined,
        Class | null | undefined
    > {

    toInstance(context: ConversionContext<Array<any>>): Array<Class | null | undefined>;
    toInstance(
        context: ConversionContext<Array<any> | null | undefined>,
    ): Array<Class | null | undefined> | null | undefined
    toInstance(
        context: ConversionContext<Array<any> | null | undefined>,
    ): Array<Class | null | undefined> | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        if (!Array.isArray(context.source)) {
            this.throwTypeMismatchError(context);
        }

        return context.source.map((element, i) => {
            return this.type.toInstance(
                {
                    ...context,
                    path: `${context.path}[${i}]`,
                    source: element,
                },
            );
        });
    }

    /**
     * Performs the conversion of an array of typed objects (or primitive values) to an array of
     * simple javascript objects (or primitive values).
     */
    toPlain(context: ConversionContext<Array<Class>>): Array<any>
    toPlain(
        context: ConversionContext<Array<Class | null | undefined> | null | undefined>,
    ): Array<any> | null | undefined
    toPlain(
        context: ConversionContext<Array<Class | null | undefined> | null | undefined>,
    ): Array<any> | null | undefined {
        if (context.source == null) {
            return context.source;
        }

        if (!Array.isArray(context.source)) {
            this.throwTypeMismatchError(context);
        }

        return context.source.map((element, i) => {
            return this.type.toPlain({
                ...context,
                path: `${context.path}[${i}]`,
                source: element,
            });
        });
    }

    getFriendlyName(): string {
        return `Array<${this.type.getFriendlyName()}>`;
    }
}

export function array<T>(elementType: Typelike<T>): ArrayConverter<T> {
    return new ArrayConverter(toConverter(elementType));
}
