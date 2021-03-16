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
                throw new TypeError(`Could not parse ${path} as Date. Expected an integer, \
got a number with decimal places.`);
            }

            return new Date(source);
        } else if (typeof source === 'string') {
            return new Date(source);
        } else if (source instanceof Date) {
            return source;
        } else {
            this.throwTypeMismatchError({
                context,
                expectedSourceType: 'an string (ISO-8601) or number (time since epoch in ms)',
            });
        }
    }

    toJson(context: ConversionContext<Date | null | undefined>): Date | null | undefined {
        return context.source;
    }
}
