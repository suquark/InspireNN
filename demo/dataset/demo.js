import { negative } from 'backend/ops.js';
import { fetch, loadFile2Global } from 'backend/symbols.js';

import { zip } from 'util/functools.js';
import { Tensor2CanvasWithImage } from 'visualize/image.js';

// import { xs2vectors, ys } from 'dataset/mnist_2000.js';
// var xs = xs2vectors().map(x => new Tensor([28, 28, 1], x));
// for (let i of xs) scale_shift(i, 2, -1);
// store('mnist/x', ImageBuffer.fromTensors(xs));
// store('mnist/y', Int32Array.from(ys));
// saveGlobal("mnist2000.json", "mnist2000.raw");

var imgs, labels;

function init() {
    return loadFile2Global('../../dataset/mnist2000.json', '../../dataset/mnist2000.raw').then(() => {
        imgs = fetch('mnist/x').tensors;
        labels = fetch('mnist/y');

        return print;
    });
}


function print(testbox) {
    for (let [img, label] of zip([imgs.slice(0, 700), labels.slice(0, 700)])) {
        let a = document.createElement('a');
        d3.select(a).attr('data-position', 'top')
            .attr('data-delay', '50')
            .attr('data-tooltip', label)
            .classed('tooltipped', true).style('margin-left', '5px');
        negative(img);
        let canvas = Tensor2CanvasWithImage(img);
        a.appendChild(canvas);
        testbox.appendChild(a);
    }

}


export { print, init };