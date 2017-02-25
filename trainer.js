import { getopt } from 'util.js';
import { shuffle } from 'util/random.js';
import { zip } from 'util/functools.js';
import getLoss from 'objective.js';
import { Timer } from 'util/timing.js';
import { assert } from 'util/assert.js';

class Trainer {

    constructor(net, options = {}) {
        options.method = getopt(options, 'method', 'sgd');
        this.net = net;
        this.loss = getLoss(options.loss);

        this.net.compile(options); // alloc mem for optimizers

        this.batch_size = getopt(options, 'batch_size', 1);

        this.k = 0; // iteration counter
    }

    getLoss(x, y) {
        this.net.forward(x, false);
        return this.loss(this.net.output, y);
    }

    train(x, y) {
        let timer = new Timer();
        timer.start('forward');
        this.net.forward(x, true); // also set the flag that lets the net know we're just training
        timer.passto('backward');
        let cost_loss = this.loss(this.net.output, y);
        this.net.backward();
        timer.stoplast();

        let regular_loss = 0.;

        this.k++;
        if (this.k % this.batch_size === 0) {
            // param, gradient, other options in future (custom learning rate etc)
            let updates = this.net.trainables;
            for (let i in updates) {
                let T = updates[i];
                // FIXME: make sure that if regularization needed to be averaged
                if (T.regularizer) regular_loss += T.regularizer.punish(T);
                // make raw batch gradient
                T.batchGrad(this.batch_size);
                // perform an update for all sets of weights
                T.optimizer.optimize(T);
                if (T.restrictor) T.restrictor.restrict(T);
            }
        }

        return {
            fwd_time: timer.getTime('forward'),
            bwd_time: timer.getTime('backward'),

            regular_loss: regular_loss,
            cost_loss: cost_loss,
            loss: cost_loss + regular_loss
        }
    }

    trainBatch(batchX, batchY) {
        assert(batchX.length == batchY.length, "data and labels have different length");

        let batch_size = batchX.length;
        let cost_loss = 0;
        let timer = new Timer();
        timer.start('batch');

        for (let i = 0; i < batch_size; i++) {
            this.net.forward(batchX[i], true); // also set the flag that lets the net know we're just training
            cost_loss += this.loss(this.net.output, batchY[i]);
            this.net.backward();
        }

        let regular_loss = 0.;
        // param, gradient, other options in future (custom learning rate etc)
        for (let T of this.net.trainables) {
            // FIXME: make sure that if regularization needed to be averaged
            if (T.regularizer) regular_loss += T.regularizer.punish(T);
            // make raw batch gradient
            T.batchGrad(batch_size);
            // perform an update for all sets of weights
            T.optimizer.optimize(T);
            if (T.restrictor) T.restrictor.restrict(T);
        }

        timer.stoplast();

        return {
            batch_time: timer.getTime('batch'),
            regular_loss: regular_loss,
            cost_loss: cost_loss,
            loss: cost_loss + regular_loss
        }
    }

}

class Batch {
    constructor(data, labels, batch_size = 32) {
        this.data = data;
        this.labels = labels;
        this.batch_size = batch_size;

        let batches = zip([data, labels]);
        this.batches = batches;
        // fix too short batch_size
        while (this.batches.length < this.batch_size) {
            this.batches = this.batches.concat(batches);
        }

        shuffle(this.batches);
        this.batches = zip(this.batches); // restore

        this.k = 0;
    }

    get length() {
        return this.batches[0].length;
    }

    nextBatch() {
        var batchX = this.batches[0].splice(0, this.batch_size);
        this.batches[0] = this.batches[0].concat(batchX);
        var batchY = this.batches[1].splice(0, this.batch_size);
        this.batches[1] = this.batches[1].concat(batchY);

        ++this.k;
        return [batchX, batchY];
    }


}

export { Trainer, Batch };