import { zeros } from 'util/array.js';
/**
 * L1 & L2 Regularization
 */
class Regularization {
    
    constructor (l2_decay = 0., l1_decay = 0.) { 
        this.l2_decay = l2_decay;
        this.l1_decay = l1_decay;
    }

    clear_loss() {
        this.l2_decay_loss = 0.0;
        this.l1_decay_loss = 0.0;
    }

    get_punish(x, l2_decay_mul = 1.0, l1_decay_mul = 1.0) {
        // learning rate for some parameters.
        var l2_decay = this.l2_decay * l2_decay_mul;
        var l1_decay = this.l1_decay * l1_decay_mul;
        var N = x.length;  // use length and for! or you may feel sick of array with tags ...
        var lgrad = zeros(N);
        for (let i = 0; i < N; i++) {
            let p = x[i];
            this.l2_decay_loss += l2_decay * p * p / 2; // accumulate weight decay loss
            this.l1_decay_loss += l1_decay * Math.abs(p);
            let l1grad = l1_decay * (p > 0 ? 1 : -1);
            let l2grad = l2_decay * (p);
            lgrad[i] = l2grad + l1grad;
        }
        return lgrad;
    }
}

export { Regularization };
