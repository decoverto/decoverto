import test from 'ava';

import {shouldOmitParseString} from '../src/helpers';

test('shouldOmitParseString should handle plain numbers', t => {
    t.is(shouldOmitParseString('50', Number), false);
});
test('shouldOmitParseString should handle numbers with decimal places', t => {
    t.is(shouldOmitParseString('50.120', Number), false);
});
test('shouldOmitParseString should handle negative numbers', t => {
    t.is(shouldOmitParseString('-50', Number), false);
});
test('shouldOmitParseString should handle negative numbers with decimal places', t => {
    t.is(shouldOmitParseString('-50.120', Number), false);
});
test('shouldOmitParseString should handle numbers with a plus', t => {
    t.is(shouldOmitParseString('-50', Number), false);
});
test('shouldOmitParseString should handle negative numbers with a plus and decimal places', t => {
    t.is(shouldOmitParseString('+50.120', Number), false);
});
test('shouldOmitParseString should handle exponential notation', t => {
    t.is(shouldOmitParseString('1e2', Number), false);
});
test('shouldOmitParseString should handle exponential notation with decimal places', t => {
    t.is(shouldOmitParseString('1.120e2', Number), false);
});
test('shouldOmitParseString should handle negative exponential notation', t => {
    t.is(shouldOmitParseString('-1e2', Number), false);
});
test('shouldOmitParseString should handle negative exponential notation with decimal places', t => {
    t.is(shouldOmitParseString('-1.120e2', Number), false);
});
test('shouldOmitParseString should handle positive exponential notation', t => {
    t.is(shouldOmitParseString('+1e2', Number), false);
});
test('shouldOmitParseString should handle positive exponential notation with decimal places', t => {
    t.is(shouldOmitParseString('+1.120e2', Number), false);
});

test('shouldOmitParseString should handle plain numeric dates', t => {
    t.is(shouldOmitParseString('50', Date), false);
});
test('shouldOmitParseString should handle negative dates', t => {
    t.is(shouldOmitParseString('-50', Date), false);
});
test('shouldOmitParseString should handle dates with a plus', t => {
    t.is(shouldOmitParseString('-50', Date), false);
});
test('shouldOmitParseString should handle dates in exponential notation', t => {
    t.is(shouldOmitParseString('1e2', Date), false);
});
test('shouldOmitParseString should handle dates in negative exponential notation', t => {
    t.is(shouldOmitParseString('-1e2', Date), false);
});
test('shouldOmitParseString should handle dates in positive exponential notation', t => {
    t.is(shouldOmitParseString('+1e2', Date), false);
});
