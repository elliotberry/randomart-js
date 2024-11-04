import {
  pipe,
  set,
  flatten,
  reverse,
  splitEvery,
  equals,
  lensPath
} from 'ramda';


const processOptions = (userProvidedHash, userProvidedOptions = {}) => {
  // Default options
  const defaults = {
    height: 9,
    width: 17,
    trail: false,
    values: [
      ' ', '.', 'o', '+', '=', '*', 'B', 'O', 'X', '@', '%', '&', '#', '/', '^'
    ],
    negativeSpace: ' ',
    border: true,
    cornerCharacters: ['+', '+', '+', '+']
  };
  let options = { ...defaults, ...userProvidedOptions };

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
    !options.values.every(value => typeof value === 'string' && value.length === 1)
  ) {
    throw TypeError('The values option must an array of single character strings');
  }
  if (options.height % 2 !== 1 || options.width % 2 !== 1) {
    throw Error('The height and width options must be odd numbers');
  }
  //if (userProvidedHash.length % 2 !== 0) {
  //  throw Error('The hash length must have an even number');
 // }
  let hash = userProvidedHash;
  if (typeof hash === 'string') {
    hash = Buffer.from(hash, 'hex');
  }
  if (hash.length % 2 !== 0) {
    hash = Buffer.concat([Buffer.alloc(1, 0), hash]);
  }
  return { hash, options };
};

// Renders the randomart image from a given hash
const render = (hashProvided, optionsProvided = {}) => {
  var {hash, options} = processOptions(hashProvided, optionsProvided);

  const { height, width, trail, values } = options;

  const pairs = bufferToBinaryPairs(hash);
  const walk = getWalk(pairs, width, height);

  const grid = Array.from({ length: height }, () => Array(width).fill(' '));

  const updateGrid = gridReducer(values);

  return trail
    ? walk.reduce(
      (grids, coord, idx, walk) =>
        grids.concat([updateGrid(grids[grids.length - 1], coord, idx, walk)]),
      [grid]
    )
    : walk.reduce(updateGrid, grid);
};

const renderToString = (hashProvided, optionsProvided = {}) => {
  var {hash, options} = processOptions(hashProvided, optionsProvided);
  let output = render(hash, options);

  if (options.negativeSpace !== ' ') {
    output = output.map(line => line.map(value => (value === ' ' ? options.negativeSpace : value)));
  }

  if (options.border) {
    output.forEach(line => {
      line.unshift('|');
      line.push('|');
    });

    const borderTop = Array(output[0].length).fill('-');
    borderTop[0] = options.cornerCharacters[0];
    borderTop[borderTop.length - 1] = options.cornerCharacters[1];
    output.unshift(borderTop);
    const borderBottom = Array(output[0].length).fill('-');
    borderBottom[0] = options.cornerCharacters[2];
    borderBottom[borderBottom.length - 1] = options.cornerCharacters[3];
    output.push(borderBottom);
  }

  return output.map(line => line.join('')).join('\n');
};

// Converts a hex string to a buffer
const hexToBuffer = str => Buffer.from(str, 'hex');

// The reducer for converting the walk into the grid
const gridReducer = values => (grid, coord, idx, walk) => {
  if (idx === walk.length - 1) {
    return pipe(
      set(lensPath([walk[0].y, walk[0].x]), 'S'),
      set(lensPath([coord.y, coord.x]), 'E')
    )(grid);
  }
  const newValue = values[(values.indexOf(grid[coord.y][coord.x]) + 1) % values.length];
  return set(lensPath([coord.y, coord.x]), newValue, grid);
};

// Pretty prints a 2d array (matrix)
const gridToString = grid =>
  grid.map(line => `[${line.join('][')}]`).join('\n');

// Converts a buffer to a binary pairs array
const bufferToBinaryPairs = buffer => {
  const str = [];
  buffer.forEach(value => {
    let binaryValue = value.toString(2).padStart(8, '0');
    str.push(binaryValue);
  });
  return flatten(str.map(pipe(splitEvery(2), reverse)));
};

// Gets the walk from a set of pairs and the box's height and width
const getWalk = (pairs, width, height) => {
  const initialPosition = {
    x: (width - 1) / 2,
    y: (height - 1) / 2
  };

  return pairs.reduce((acc, pair) => {
    const position = acc[acc.length - 1];
    const X = position.x;
    const Y = position.y;
    const leftEdge = 0;
    const topEdge = 0;
    const rightEdge = width - 1;
    const bottomEdge = height - 1;
    const leftX = X - 1;
    const rightX = X + 1;
    const upY = Y - 1;
    const downY = Y + 1;
    const moveLeft = { x: leftX, y: Y };
    const moveRight = { x: rightX, y: Y };
    const moveUp = { x: X, y: upY };
    const moveDown = { x: X, y: downY };
    const moveUpLeft = { x: leftX, y: upY };
    const moveUpRight = { x: rightX, y: upY };
    const moveDownLeft = { x: leftX, y: downY };
    const moveDownRight = { x: rightX, y: downY };

    switch (true) {
      case equals(position, { x: leftEdge, y: topEdge }):
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
        break;
      case equals(position, { x: rightEdge, y: topEdge }):
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
        break;
      case equals(position, { x: leftEdge, y: bottomEdge }):
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
        break;
      case equals(position, { x: rightEdge, y: bottomEdge }):
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
        break;
      case position.y === topEdge:
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
        break;
      case position.y === bottomEdge:
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
        break;
      case position.x === leftEdge:
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
        break;
      case position.x === rightEdge:
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
        break;
      default:
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
  }, [initialPosition]);
};

// Converts the walk into the numeric format found in the drunken bishop paper
const walkToNumeric = (walk, width, height) =>
  walk.map(({ y, x }) => y * width + x);

export {
  render,
  renderToString,
  hexToBuffer,
  gridToString,
  bufferToBinaryPairs,
  getWalk,
  walkToNumeric
};
