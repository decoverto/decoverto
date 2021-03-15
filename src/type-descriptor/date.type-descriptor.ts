import {SimpleTypeDescriptor} from './simple.type-descriptor';
import {ConversionContext} from './type-descriptor';

export class DateTypeDescriptor extends SimpleTypeDescriptor<Date | string | number, Date> {

    constructor() {
        super(Date);
    }

    fromJson(context: ConversionContext<Date | string | number | null | undefined>) {
        const {path, sourceObject} = context;

        if (sourceObject === null) {
            return null;
        } else if (typeof sourceObject === 'number') {
            const isInteger = sourceObject % 1 === 0;

            if (!isInteger) {
                throw new TypeError(`Could not parse ${path} as Date. Expected an integer, \
got a number with decimal places.`);
            }

            return new Date(sourceObject);
        } else if (typeof sourceObject === 'string') {
            return new Date(sourceObject);
        } else if (sourceObject instanceof Date) {
            return sourceObject;
        } else {
            this.throwTypeMismatchError({
                context,
                expectedSourceType: 'an string (ISO-8601) or number (time since epoch in ms)',
            });
        }
    }

    toJson(context: ConversionContext<Date | null | undefined>): Date | null | undefined {
        return context.sourceObject;
    }
}
