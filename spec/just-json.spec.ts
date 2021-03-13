import {DecoratedJson, jsonArrayMember, jsonMember, jsonObject} from '../src';

const decoratedJson = new DecoratedJson();

describe('json (without automatic stringify)', () => {
    describe('string', () => {
        it('should parse from JSON', () => {
            expect(() => decoratedJson.type(String).parse('"sdfs"fdsf"')).toThrow();
        });

        it('should perform conversion to JSON', () => {
            expect(decoratedJson.type(String).toPlainJson('str')).toEqual('str');
        });
    });

    describe('rest of primitives', () => {
        it('should parse from JSON', () => {
            expect(decoratedJson.type(Number).parse(45834)).toEqual(45834);
            expect(decoratedJson.type(Boolean).parse(true)).toEqual(true);
            expect(decoratedJson.type(Date).parse(1543915254)).toEqual(new Date(1543915254));
            expect(decoratedJson.type(Date).parse('1970-01-18T20:51:55.254Z'))
                .toEqual(new Date(1543915254));

            const dataBuffer = Uint8Array.from([100, 117, 112, 97]) as any;
            expect(decoratedJson.type(ArrayBuffer).parse('畤慰')).toEqual(dataBuffer);
            expect(decoratedJson.type(DataView).parse('畤慰')).toEqual(dataBuffer);
            expect(decoratedJson.type(Uint8Array).parse([100, 117, 112, 97])).toEqual(dataBuffer);
        });

        it('should perform conversion to JSON', () => {
            expect(decoratedJson.type(Number).toPlainJson(45834)).toEqual(45834);
            expect(decoratedJson.type(Boolean).toPlainJson(true)).toEqual(true);
            const dateMs = new Date(1543915254);
            expect(decoratedJson.type(Date).toPlainJson(dateMs)).toEqual(dateMs);
            expect(decoratedJson.type(Date).toPlainJson(dateMs)).toBeInstanceOf(Date);
            const dateStr = new Date('2018-12-04T09:20:54');
            expect(decoratedJson.type(Date).toPlainJson(dateStr)).toEqual(dateStr);

            const buffer = new ArrayBuffer(4);
            const view = new DataView(buffer);
            view.setInt8(0, 100);
            view.setInt8(1, 117);
            view.setInt8(2, 112);
            view.setInt8(3, 97);
            expect(decoratedJson.type(ArrayBuffer).toPlainJson(buffer)).toEqual('畤慰');
            expect(decoratedJson.type(DataView).toPlainJson(view)).toEqual('畤慰');
            expect(decoratedJson.type(Uint8Array).toPlainJson(new Uint8Array(buffer)))
                .toEqual([100, 117, 112, 97]);
        });
    });

    describe('object', () => {
        @jsonObject()
        class SomeThing {
            @jsonMember()
            propStr: string;
            @jsonMember()
            propNum: number;
            @jsonArrayMember(() => String)
            propArr: Array<string>;
            @jsonMember()
            propDate: Date;
        }

        const json = Object.freeze({
            propStr: 'dsgs',
            propNum: 653,
            propArr: ['dslfks'],
            propDate: new Date(1543915254),
        });

        const somethingHandler = decoratedJson.type(SomeThing);

        it('should parse from JSON', () => {
            expect(somethingHandler.parse(json)).toEqual(Object.assign(new SomeThing(), json));
            expect(somethingHandler.parseArray([json]))
                .toEqual([Object.assign(new SomeThing(), json)]);
        });

        it('should perform conversion to JSON', () => {
            expect(somethingHandler.toPlainJson(Object.assign(new SomeThing(), json)))
                .toEqual(json);
            expect(somethingHandler.toPlainArray([Object.assign(new SomeThing(), json)]))
                .toEqual([json]);
        });
    });

    describe('array', () => {
        it('should parse from JSON', () => {
            expect(decoratedJson.type(String).parseArray(['alas', 'dfsd']))
                .toEqual(['alas', 'dfsd']);
        });

        it('should perform conversion to JSON', () => {
            expect(decoratedJson.type(String).toPlainArray(['alas', 'dfsd']))
                .toEqual(['alas', 'dfsd']);
        });
    });
});
