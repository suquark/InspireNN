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

var net, net_f, trainer;

function gen_net(lr = 0.001, regl = 0.001, optimizer = 'adam') {
    net = new Sequential([
        { type: 'input', shape: [1] },
        { type: 'fc', num_neurons: 20 },
        'elu',
        { type: 'fc', num_neurons: 20 },
        'lrelu',
        { type: 'fc', num_neurons: 20 },
        'sigmoid',
        { type: 'fc', num_neurons: 1 }
    ]);


    net_f = x => net.forward(Tensor.fromNumber(x)).toNumber();

    trainer = new Trainer(net, {
        learning_rate: lr,
        lr_decay: 0,
        method: optimizer,
        loss: 'mse',
        batch_size: batch_size,
        l2_decay: regl
    });
}

/* input */

var complexity = d3.select("#complexity").on("input", function() {
    d3.select("#complexity-text").text(`Complexity = ${+this.value}`);
    reload();
}).node();


var traindata_size = d3.select('#traindata_size').on("input", function() {
    d3.select("#traindata_size-text").text(`# of data points = ${+this.value}`);
    gen_data(+this.value);
}).node();


var lr = $('#learning_rate').on('change', function() {
    gen_net(+lr.value, +regl.value, optim.value);
})[0];

var regl = $('#regl').on('change', function() {
    gen_net(+lr.value, +regl.value, optim.value);
})[0];

var optim = $('#optim').on('change', function() {
    gen_net(+lr.value, +regl.value, optim.value);
})[0];


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

    // set drawing boundary by targetf
    plot.setSpan(targetf, 800, 400);
    // Plot groundTruth
    groundTruthPlot.draw(targetf);
}


function gen_data(N) {
    var pairs = sampleFunctionUniform(targetf, N, -5, 5);
    gen_batch(...pairs);
    var points = zip(pairs).map(([x, y]) => ({ x: x, y: y }));
    regressionPlot.accurate = Math.max(100, N * 2);
    plot.drawPoints(points);
}

function gen_batch(data, labels) {
    // preprocess data
    data = Array.from(data).map(Tensor.fromNumber);
    labels = Array.from(labels).map(Tensor.fromNumber);
    batch = new Batch(data, labels, batch_size);
}

function reload() {
    gen_func(complexity.value | 0);
    gen_data(traindata_size.value | 0);
    gen_net(+lr.value, +regl.value, optim.value);
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
    // train
    for (let iters = 0; iters < epoch; iters++) {
        let stats = trainer.trainBatch(...batch.nextBatch());
        loss_record.push(stats.loss);
        time_record.push(stats.batch_time);
    }
    // update record
    if (steps % 5 == 0) {
        iterstext.text(`${steps}`);
        avlosstext.text(`${loss_record.average.toExponential(3)}`);
        avtimetext.text(`${(time_record.average * epoch).toFixed(3)} ms`);
    }
    // redraw network as an function
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