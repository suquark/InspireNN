/**
 * 2000 gray images of size 28 * 28 in [0.0, 1.0]
 * 0.0 - background, 1.0 - number
 */

import { mnist_xs } from 'dataset/mnist_raw2000.js';
export { mnist_xs as xs, mnist_ys as ys } from 'dataset/mnist_raw2000.js';

const size = 2000;
const dlength = mnist_xs.length / size;
function xs2vectors() {
    let l = [];
    for (let i = 0; i < mnist_xs.length; i += dlength) {
        let arr = new Float32Array(dlength);
        for (let j = 0; j < dlength; j++) {
            arr[j] = mnist_xs[i+j];
        }
        l.push(arr);
    }
    return l;
}

export { xs2vectors };