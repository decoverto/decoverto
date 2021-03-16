import {InvalidValueError} from '../errors/invalid-value.error';
import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

export class DateTypeDescriptor
    extends SimpleTypeDescriptor<Date | string | number, Date | null | undefined> {

    constructor() {
        super(Date);
    }

    fromJson(context: ConversionContext<Date | string | number | null | undefined>) {
        const {path, source} = context;

        if (source === null) {
            return null;
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

    toJson(context: ConversionContext<Date | null | undefined>): Date | null | undefined {
        return context.source;
    }
}
