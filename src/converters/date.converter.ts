import {InvalidValueError} from '../errors/invalid-value.error';
import {ConversionContext} from './converter';
import {SimpleConverter} from './simple.converter';

export class DateConverter
    extends SimpleConverter<Date | string | number, Date | null | undefined> {

    constructor() {
        super(Date);
    }

    toInstance(context: ConversionContext<Date | string | number | null | undefined>) {
        const {path, source} = context;

        if (source == null) {
            return source;
        } else if (typeof source === 'number') {
            const isInteger = source % 1 === 0;

            if (!isInteger) {
                throw new InvalidValueError({
                    path,
                    actualType: 'Float',
                    expectedType: 'a string (ISO-8601) or integer (time since epoch in ms)',
                });
            }

            return new Date(source);
        } else if (typeof source === 'string') {
            return new Date(source);
        } else if (source instanceof Date) {
            return source;
        } else {
            this.throwTypeMismatchError({
                ...context,
                expectedType: 'a string (ISO-8601) or integer (time since epoch in ms)',
            });
        }
    }

    toPlain(context: ConversionContext<Date | null | undefined>): Date | null | undefined {
        return context.source;
    }
}
