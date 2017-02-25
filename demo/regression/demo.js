import { Sequential } from 'topology/sequential.js';
import { Trainer, Batch } from 'trainer.js';

import { Tensor } from 'backend/tensor.js';
import { randf, sampleFunctionUniform } from 'util/random.js';
import { assert } from 'util/assert.js';

import { zip } from 'util/functools.js';

import { AvgWindow } from 'util/record.js';
import { Plot1D } from 'visualize/plot.js';

assert(d3, "d3js is required for this demo");

/* constant */

const batch_size = 32,
    epoch = 5;

/* net */

var net = new Sequential();
net.makeLayers([
    { type: 'input', out_sx: 1, out_sy: 1, out_depth: 1 },
    { type: 'fc', num_neurons: 20 },
    'lrelu',
    { type: 'fc', num_neurons: 20 },
    'lrelu',
    { type: 'fc', num_neurons: 20 },
    'sigmoid',
    { type: 'fc', num_neurons: 1 }
]);

var trainer = new Trainer(net, {
    learning_rate: 0.001,
    lr_decay: 0,
    method: 'adam',
    loss: 'mse',
    batch_size: batch_size,
    l2_decay: 0.001
});


var net_f = x => net.forward(Tensor.fromNumber(x)).w[0];

/* input */

var complexity = d3.select("#complexity").on("input", function() {
    d3.select("#complexity-text").text(`complexity = ${+this.value}`);
    reload();
}).node();

var traindata_size = d3.select('#traindata_size').on("input", function() {
    d3.select("#traindata_size-text").text(`# of data points = ${+this.value}`);
    gen_data(+this.value);
}).node();

/* control */

d3.select("#reload").on("click", function() {
    reload();
});


d3.select("#play_control").on("click", function() {
    if (conti) {
        d3.select("#play_icon").text("play_arrow");
        conti = false;
    } else {
        d3.select("#play_icon").text("pause");
        conti = true;
        iterate();
    }

});


/* plot */

var svg = d3.select('#testbox')
    .append('svg')
    .attr('width', '800')
    .attr('height', '400');

var plot = new Plot1D(svg, [-5, 5]);
var groundTruthPlot = plot.createPlot(450),
    regressionPlot = plot.createPlot(100);

/* data */

var targetf, batch;

function gen_func(vari = 1) {
    let A = [],
        phi = [],
        k = [];
    for (let i = 0; i < vari; i++) {
        A.push(randf(-1, 1));
        phi.push(randf(-2, 2));
        k.push(randf(-vari, vari));
    }
    targetf = function(x) {
        let r = 0;
        for (let i = 0; i < vari; i++) r += A[i] * Math.sin(k[i] * x + phi[i]);
        return r;
    };

    plot.setSpan(targetf, 800, 400);
    groundTruthPlot.draw(targetf);
}


function gen_data(N) {
    var pairs = sampleFunctionUniform(targetf, N, -5, 5);
    var [data, labels] = pairs;

    // preprocess data
    data = Array.from(data).map(Tensor.fromNumber);
    labels = Array.from(labels).map(Tensor.fromNumber);
    batch = new Batch(data, labels, batch_size);

    var points = zip(pairs).map(([x, y]) => ({ x: x, y: y }));
    regressionPlot.accurate = Math.max(100, N * 2);
    plot.drawPoints(points);
}

function reload() {
    gen_func(complexity.value | 0);
    gen_data(traindata_size.value | 0);
}

/* record */

var avlosstext = d3.select('#avloss'),
    avtimetext = d3.select('#avtime'),
    iterstext = d3.select('#iters');

var loss_record = new AvgWindow(batch_size * epoch, 1);
var time_record = new AvgWindow(batch_size * epoch * 10, 1);


/* train */

var steps = 0;

function update() {
    ++steps;
    for (let iters = 0; iters < epoch; iters++) {
        let stats = trainer.trainBatch(...batch.nextBatch());
        loss_record.push(stats.loss);
        time_record.push(stats.batch_time);
    }
    if (steps % 5 == 0) {
        iterstext.text(`${steps}`);
        avlosstext.text(`${loss_record.average.toExponential(3)}`);
        avtimetext.text(`${(time_record.average * epoch).toFixed(3)} ms`);
    }
    regressionPlot.draw(net_f);
}

/* running control */

var conti = true;

function iterate() {
    update();
    if (!conti) return;
    window.requestAnimationFrame(iterate);
}

reload();
iterate();