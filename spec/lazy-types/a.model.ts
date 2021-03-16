import {jsonObject, jsonProperty} from '../../src';
import {B} from './b.model';

@jsonObject()
export class A {

    @jsonProperty(() => B)
    b: B;

    @jsonProperty()
    name: string;

    test(): true {
        return true;
    }
}
