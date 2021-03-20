// eslint-disable-next-line ava/use-test
import {Macro} from 'ava';

import {Constructor, DecoratedJson} from '../../src';

export interface CreatePassThroughMacro<T> {
    class: Constructor<any>;
    createSubject: (value: T) => any;
}

export interface PassThroughMacro<T> {
    type: 'fromJson' | 'toJson';
    value: T;
}

export function createPassThroughMacro<T>(
    createOptions: CreatePassThroughMacro<T>,
): Macro<[PassThroughMacro<T>]> {
    const typeHandler = new DecoratedJson().type(createOptions.class);
    const macro: Macro<[PassThroughMacro<T>]> = (t, options) => {
        const subject = createOptions.createSubject(options.value);
        const result = options.type === 'fromJson'
            ? typeHandler.parse(subject)
            : typeHandler.toPlainJson(Object.assign(new createOptions.class(), subject));

        Object.keys(subject).forEach(key => {
            t.is(result[key], options.value);
        });
    };
    macro.title = (providedTitle, options) => {
        return `${providedTitle} ${options.type === 'fromJson' ? 'from JSON' : 'to JSON'} should \
pass ${options.value}`;
    };

    return macro;
}
