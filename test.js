import {renderToString} from './index.js';

console.log(renderToString('0dc42888c069d94ab5306b397169389f1783adfcc49596d4562dda46efa181fe7da5acb7cbc824d8db0b892c3047dea99cde0d6d293b700e3320bfb2b9eb0c5a'));

console.log(renderToString('0dc47788c069d94ab5306b397169389f1783adfcc49596d4562dda46efa181fe7da5acb7cbc824d8db0b892c3047dea99cde0d6d293b700e3320bfb2b9eb0c5a'));

console.log(renderToString('fffa'));
console.log(renderToString('daddy'));
console.log(renderToString('deadbeef'));
/*
console.log(
  renderToString('deadbeef', {
    height: 9,
    width: 17,
    trail: true,
    values: [' ', '.', 'o', '+', '=', '*', 'B', 'O', 'X', '@', '%', '&', '#', '/', '^'],
    negativeSpace: ' ',
    border: true,
    cornerCharacters: ['+', '+', '+', '+'],
  }),
);
*/