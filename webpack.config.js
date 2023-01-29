import path from "path";

export default {
  entry: {
    main: path.resolve('./src/index.js'),
  },
  output: {
    path: path.resolve('./dist'),
    filename: '[name].bundle.js',
  }
}