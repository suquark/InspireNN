import { getopt } from 'util.js'
import { Regularization } from 'regularization.js'

class Trainer {

    constructor(net, options={}) {
        options.method = getopt(options, 'method', 'sgd'); 

        this.net = net;
        this.net.compile(options);  // alloc mem for optimizers
        this.batch_size = getopt(options, 'batch_size', 1); 
        this.regular = new Regularization(options.l2_decay, options.l1_decay);
        
        this.k = 0; // iteration counter

        // check if regression is expected 
        this.regression = (this.net.outputLayer().layer_type === "regression");
    }

    train(x, y) {

        var start = new Date().getTime();
        this.net.forward(x, true); // also set the flag that lets the net know we're just training
        var end = new Date().getTime();
        var fwd_time = end - start;

        var start = new Date().getTime();
        var cost_loss = this.net.backward(y);
        var end = new Date().getTime();
        var bwd_time = end - start;

        // if(this.regression && y.constructor !== Array)
        //     console.log("Warning: a regression net requires an array as training output vector.");
        
        this.regular.clear_loss();

        this.k++;
        if (this.k % this.batch_size === 0) {
            // param, gradient, other options in future (custom learning rate etc)
            let pgs = this.net.getParamsAndGrads();
            for (let i in pgs) {
                let pg = pgs[i];
                let p = pg.params, g = pg.grads;
                let batch_grad = this.regular.get_punish(p, pg.l2_decay_mul, pg.l1_decay_loss);
                // make raw batch gradient
                for (let i = 0; i < p.length; i++) {
                    batch_grad[i] = (batch_grad[i] + g[i]) / this.batch_size; 
                }
                let update = pg.optimizer.grad(batch_grad);
                // perform an update for all sets of weights
                for (let i = 0; i < p.length; i++) p[i] += update[i];
            }
        }

        // appending softmax_loss for backwards compatibility, but from now on we will always use cost_loss
        // in future, TODO: have to completely redo the way loss is done around the network as currently 
        // loss is a bit of a hack. Ideally, user should specify arbitrary number of loss functions on any layer
        // and it should all be computed correctly and automatically. 
        return {fwd_time: fwd_time, bwd_time: bwd_time, 
                l2_decay_loss: this.regular.l2_decay_loss, l1_decay_loss: this.regular.l1_decay_loss,
                cost_loss: cost_loss, softmax_loss: cost_loss, 
                loss: cost_loss + this.regular.l1_decay_loss + this.regular.l2_decay_loss}
    }
}

export { Trainer };

