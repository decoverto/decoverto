// eslint-disable-next-line ava/use-test
import {TestInterface} from 'ava';

export function setAvaContext<T>(avaTest: TestInterface): asserts avaTest is TestInterface<T> {
    // We don't do anything
}

/**
 * The function fakes usage to prevent noUnusedLocals from complaining.
 */
export function use(anything: any): void {
    // Do nothing
}
