// eslint-disable-next-line ava/use-test
import {TestInterface} from 'ava';

export function setAvaContext<T>(avaTest: TestInterface): asserts avaTest is TestInterface<T> {
    // We don't do anything
}
