// eslint-disable-next-line ava/use-test
import {Macro} from 'ava';

import {Constructor, DecoratedJson} from '../../src';
import {isObject} from '../../src/helpers';

export interface CreatePassThroughMacro<T> {
    class: Constructor<any>;

    /**
     * Function used to create the test subject, e.g. value => ({date: value}).
     */
    createSubject: (value: T) => Record<string, unknown>;
}

export interface PassThroughMacro<T> {
    /**
     * Whether to test `parse` or `toPlain`.
     */
    type: 'fromJson' | 'toJson';

    /**
     * Will be used to create the test subject and perform the strict equal check.
     */
    value: T;
}

/**
 * The pass through macro tests whether running `parse` and `toPlain` on an object preserves the
 * value. This is handy to test whether, for example, the converter functions return `null` when
 * given `null` as source and `undefined` when given `undefined`. It will perform a strict equal
 * check between the properties of the `parse/toPlain` result and the given value.
 */
export function createPassThroughMacro<T>(
    createOptions: CreatePassThroughMacro<T>,
): Macro<[PassThroughMacro<T>]> {
    const typeHandler = new DecoratedJson().type(createOptions.class);
    const macro: Macro<[PassThroughMacro<T>]> = (t, options) => {
        const subject = createOptions.createSubject(options.value);
        const result = options.type === 'fromJson'
            ? typeHandler.parsePlain(subject)
            : typeHandler.toPlain(Object.assign(new createOptions.class(), subject));

        Object.keys(subject).forEach(key => {
            t.is(result[key], options.value);
        });
    };
    macro.title = (providedTitle, options) => {
        return `${providedTitle} ${options.type === 'fromJson' ? 'from JSON' : 'to JSON'} should \
pass${isObject(options.value) ? ' and referentially equal' : ''} ${JSON.stringify(options.value)}`;
    };

    return macro;
}
