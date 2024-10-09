import {repeat, pipe, set, flatten, reverse, splitEvery, equals, lensPath} from 'ramda';

let hash;
let options;

const processOptions = function (userProvidedHash, userProvidedOptions = {}) {
  // Default options
  const defaults = {
    height: 9,
    width: 17,
    trail: false,
    values: [' ', '.', 'o', '+', '=', '*', 'B', 'O', 'X', '@', '%', '&', '#', '/', '^'],
    negativeSpace: ' ',
    border: true,
    cornerCharacters: ['+', '+', '+', '+'],
    display: false,
  };
  options = Object.assign(defaults, userProvidedOptions);

  if (!(userProvidedHash instanceof Buffer || typeof userProvidedHash === 'string') || userProvidedHash.length === 0) {
    throw TypeError('You must pass in a non-zero length hash or string');
  }
  if ((typeof options.height !== 'number') || (typeof options.width !== 'number')) {
    throw TypeError('The height and width options must be numbers');
  }
  if (typeof options.trail !== 'boolean') {
    throw TypeError('The trail option must be a boolean');
  }
  if (
    !(options.values instanceof Array) ||
    !options.values.every(value => {
      return typeof value === 'string' && value.length === 1;
    })
  ) {
    throw TypeError('The values option must an array of single character strings');
  }

  if (options.height % 2 !== 1 || options.width % 2 !== 1) {
    throw Error('The height and width options must be odd numbers');
  }
  if (userProvidedHash.length % 2 !== 0) {
    throw Error('The hash length must have an even number');
  }
  hash = userProvidedHash;
};

// Renders the randomart image from a given hash
const render = function (hashProvided, optionsProvided = {}) {
  processOptions(hashProvided, optionsProvided);

  const {height, width, trail, values} = options;

  const pairs = bufferToBinaryPairs(typeof hash === 'string' ? Buffer.from(hash, 'hex') : hash);
  const walk = getWalk(pairs, width, height);
  //console.log(walk);
  const grid = repeat([], height).map(line => {
    return repeat(' ', width);
  });

  const updateGrid = gridReducer(values);

  return trail ? walk.reduce(
    (grids, coord, idx, walk) => {
      return grids.concat([updateGrid(last(grids), coord, idx, walk)]);
    },
    [grid],
  ) : walk.reduce(updateGrid, grid);
};

const renderToString = function (hashProvided, optionsProvided = {}) {
  processOptions(hashProvided, optionsProvided);
  let output = render(hashProvided, optionsProvided);

  if (options.negativeSpace !== ' ') {
    output = output.map(line => line.map(value => (value === ' ' ? options.negativeSpace : value)));
  }

  if (options.border) {
    output.map(line => {
      line.unshift('|');
      line.push('|');
    });

    const borderTop = repeat('-', output[0].length);
    borderTop[0] = options.cornerCharacters[0];
    borderTop[borderTop.length - 1] = options.cornerCharacters[1];
    output.unshift(borderTop);
    const borderBottom = repeat('-', output[0].length);
    borderBottom[0] = options.cornerCharacters[2];
    borderBottom[borderBottom.length - 1] = options.cornerCharacters[3];
    output.push(borderBottom);
  }

  const str = output.map(line => line.join('')).join('\n');

  return output.map(line => line.join('')).join('\n');
};

// Converts a hex string to a buffer
const hexToBuffer = function (str) {
  return Buffer.from(str, 'hex');
};

// The reducer for converting the walk into the grid
var gridReducer = function (values) {
  return function updateGrid(grid, coord, idx, walk) {
    if (idx === walk.length - 1) {
      return pipe(set(lensPath([walk[0].y, walk[0].x]), 'S'), set(lensPath([coord.y, coord.x]), 'E'))(grid);
    }
    const newValue = values[values.indexOf(grid[coord.y][coord.x]) + 1];
    return set(lensPath([coord.y, coord.x]), newValue, grid);
  };
};

// Pretty prints a 2d array (matrix)
const gridToString = function (grid) {
  return grid
    .map(line => {
      return `[${line.join('][')}]`;
    })
    .join('\n');
};

// Converts a buffer to a binary pairs array
var bufferToBinaryPairs = function (buffer) {
  const str = [];
  buffer.forEach(value => {
    let binaryValue = value.toString(2);
    if (binaryValue.length < 8) binaryValue = repeat('0', 8 - binaryValue.length).join('') + binaryValue;
    str.push(binaryValue);
  });
  return flatten(str.map(pipe(splitEvery(2), reverse)));
};

// Gets the walk from a set of pairs and the box's height and width
var getWalk = function (pairs, width, height) {
  var width = width || defaults.width;
  var height = height || defaults.height;

  const initialPosition = {x: (width - 1) / 2, y: (height - 1) / 2};

  return pairs.reduce(
    (acc, pair) => {
      const position = acc[acc.length - 1];

      const X = position.x;
      const Y = position.y;
      const leftEdge = 0;
      const topEdge = 0;
      const rightEdge = width - 1;
      const bottomEdge = height - 1;
      const leftX = position.x - 1;
      const rightX = position.x + 1;
      const upY = position.y - 1;
      const downY = position.y + 1;
      const moveLeft = {x: leftX, y: Y};
      const moveRight = {x: rightX, y: Y};
      const moveUp = {x: X, y: upY};
      const moveDown = {x: X, y: downY};
      const moveUpLeft = {x: leftX, y: upY};
      const moveUpRight = {x: rightX, y: upY};
      const moveDownLeft = {x: leftX, y: downY};
      const moveDownRight = {x: rightX, y: downY};

      // Top-left position (a)
      if (equals(position, {x: leftEdge, y: topEdge})) {
        switch (pair) {
          case '00':
            return acc.concat(position);
          case '01':
            return acc.concat(moveRight);
          case '10':
            return acc.concat(moveDown);
          case '11':
            return acc.concat(moveDownRight);
        }
      }
      // Top-right position (b)
      else if (equals(position, {x: rightEdge, y: topEdge})) {
        switch (pair) {
          case '00':
            return acc.concat(moveLeft);
          case '01':
            return acc.concat(position);
          case '10':
            return acc.concat(moveDownLeft);
          case '11':
            return acc.concat(moveDown);
        }
      }
      // Bottom-left position (c)
      else if (equals(position, {x: leftEdge, y: bottomEdge})) {
        switch (pair) {
          case '00':
            return acc.concat(moveUp);
          case '01':
            return acc.concat(moveUpRight);
          case '10':
            return acc.concat(position);
          case '11':
            return acc.concat(moveRight);
        }
      }
      // Bottom-right position (d)
      else if (equals(position, {x: rightEdge, y: bottomEdge})) {
        switch (pair) {
          case '00':
            return acc.concat(moveUpLeft);
          case '01':
            return acc.concat(moveUp);
          case '10':
            return acc.concat(moveLeft);
          case '11':
            return acc.concat(position);
        }
      }
      // Top position (T)
      else if (position.y === topEdge) {
        switch (pair) {
          case '00':
            return acc.concat(moveLeft);
          case '01':
            return acc.concat(moveRight);
          case '10':
            return acc.concat(moveDownLeft);
          case '11':
            return acc.concat(moveDownRight);
        }
      }
      // Bottom position (B)
      else if (position.y === bottomEdge) {
        switch (pair) {
          case '00':
            return acc.concat(moveUpLeft);
          case '01':
            return acc.concat(moveUpRight);
          case '10':
            return acc.concat(moveLeft);
          case '11':
            return acc.concat(moveRight);
        }
      }
      // Left position (L)
      else if (position.x === leftEdge) {
        switch (pair) {
          case '00':
            return acc.concat(moveUp);
          case '01':
            return acc.concat(moveUpRight);
          case '10':
            return acc.concat(moveDown);
          case '11':
            return acc.concat(moveDownRight);
        }
      }
      // Right position (R)
      else if (position.x === rightEdge) {
        switch (pair) {
          case '00':
            return acc.concat(moveUpLeft);
          case '01':
            return acc.concat(moveUp);
          case '10':
            return acc.concat(moveDownLeft);
          case '11':
            return acc.concat(moveDown);
        }
      }
      // Middle position (M)
      else {
        switch (pair) {
          case '00':
            return acc.concat(moveUpLeft);
          case '01':
            return acc.concat(moveUpRight);
          case '10':
            return acc.concat(moveDownLeft);
          case '11':
            return acc.concat(moveDownRight);
        }
      }
    },
    [initialPosition],
  );
};

const display = output => {
  console.log(output);
};
// Converts the walk into the numeric format found in the drunken bishop paper
const walkToNumeric = (walk, width, height) => {
  var width = width || defaults.width;
  var height = height || defaults.height;

  return walk.reduce((acc, {y, x}) => {
    return acc.concat(y * width + x);
  }, []);
};

export {render, renderToString, hexToBuffer, gridToString, bufferToBinaryPairs, getWalk, walkToNumeric};
