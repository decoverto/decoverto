import {model, property} from '../../../src';
import {A} from './a.model';

@model()
export class B {

    @property(() => A)
    a: A;

    @property()
    name: string;

    test(): true {
        return true;
    }
}
