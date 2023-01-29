import {render,renderToString,  bufferToBinaryPairs, getWalk, hexToBuffer} from "./src/randomart.js";

let g = render('fc94b0c1e5b0987c5843997697ee9fb7')
//console.log(g)

var hash = 'fc94b0c1e5b0987c5843997697ee9fb7'

var art = renderToString(hash)


console.log(art)
