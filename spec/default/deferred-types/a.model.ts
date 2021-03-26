import {model, property} from '../../../src';
import {B} from './b.model';

@model()
export class A {

    @property(() => B)
    b: B;

    @property()
    name: string;

    test(): true {
        return true;
    }
}
