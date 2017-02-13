import { getopt } from 'util.js'

import getLoss from 'objective.js';
import { Timer } from 'util/timing.js';

class Trainer {

    constructor(net, options={}) {
        options.method = getopt(options, 'method', 'sgd'); 
        this.net = net;
        this.loss = getLoss(options.loss);

        this.net.compile(options);  // alloc mem for optimizers

        this.batch_size = getopt(options, 'batch_size', 1); 
        // this.regular = new Regularization(options.l2_decay, options.l1_decay);
        
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

}

export { Trainer };

