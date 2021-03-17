import {jsonObject, jsonProperty} from '../../src';
import {A} from './a.model';

@jsonObject()
export class B {

    @jsonProperty(() => A)
    a: A;

    @jsonProperty()
    name: string;

    test(): true {
        return true;
    }
}
