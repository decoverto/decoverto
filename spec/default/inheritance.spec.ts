import test from 'ava';

import {Decoverto, jsonObject, jsonProperty} from '../../src';

class UParent {

    @jsonProperty()
    parentProperty: string;
}

@jsonObject()
class UParentDChild extends UParent {

    @jsonProperty()
    childProperty: string;
}

@jsonObject()
class DParent {

    @jsonProperty()
    parentProperty: string;
}

@jsonObject()
class DParentDChild extends DParent {

    @jsonProperty()
    childProperty: string;
}

@jsonObject()
class DParentDChildDChild extends DParentDChild {

    @jsonProperty()
    child2Property: string;
}

class DParentUChild extends DParent {

    @jsonProperty()
    childProperty: string;
}

class DParentUChildUChild extends DParentDChild {

    @jsonProperty()
    child2Property: string;
}

const decoverto = new Decoverto();

test('Converting from JSON with a decorated parent and child should work', t => {
    const result = decoverto.type(DParentDChild).plainToInstance({
        parentProperty: 'parent',
        childProperty: 'child',
    });

    t.is(result.childProperty, 'child');
    t.is(result.parentProperty, 'parent');
});

test('Converting a decorated subtype to plain with .type(Parent) should work', t => {
    const subject = new DParentDChild();
    subject.childProperty = 'child';
    subject.parentProperty = 'parent';
    const result = decoverto.type(DParent).instanceToPlain(subject);

    t.deepEqual(result, {
        childProperty: 'child',
        parentProperty: 'parent',
    });
});

test('Converting a decorated subtype of a subtype to plain with .type(Parent) should work', t => {
    const subject = new DParentDChildDChild();
    subject.childProperty = 'child';
    subject.child2Property = 'child2';
    subject.parentProperty = 'parent';
    const result = decoverto.type(DParent).instanceToPlain(subject);

    t.deepEqual(result, {
        childProperty: 'child',
        child2Property: 'child2',
        parentProperty: 'parent',
    });
});

test('Converting an undecorated subtype to plain with .type(Parent) should work', t => {
    const subject = new DParentUChild();
    subject.childProperty = 'child';
    subject.parentProperty = 'parent';
    const result = decoverto.type(DParent).instanceToPlain(subject);

    t.deepEqual(result, {
        childProperty: 'child',
        parentProperty: 'parent',
    });
});

test('Converting DParentUChildUChild of a subtype to plain with .type(Parent) should work', t => {
    const subject = new DParentUChildUChild();
    subject.childProperty = 'child';
    subject.child2Property = 'child2';
    subject.parentProperty = 'parent';
    const result = decoverto.type(DParent).instanceToPlain(subject);

    t.deepEqual(result, {
        childProperty: 'child',
        child2Property: 'child2',
        parentProperty: 'parent',
    });
});

test('Converting a decorated  child of an undecorated parent with .type(Child) should work', t => {
    const subject = new UParentDChild();
    subject.parentProperty = 'parent';
    subject.childProperty = 'child';
    const result = decoverto.type(UParentDChild).instanceToPlain(subject);

    t.deepEqual(result, {
        parentProperty: 'parent',
        childProperty: 'child',
    });
});
