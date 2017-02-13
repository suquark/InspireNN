import { zeros } from 'util/array.js';
/**
 * L1 & L2 Regularization
 */
class Regularization {
    
    constructor (l2_decay = 0., l1_decay = 0., l2_decay_mul = 1.0, l1_decay_mul = 1.0) { 
        this.l2_decay = l2_decay;
        this.l1_decay = l1_decay;
        this.l2_decay_mul = l2_decay_mul;
        this.l1_decay_mul = l1_decay_mul;
    }

    punish(T) {
        let x = T.w, dx = T.dw, N = T.size;
        let decay_loss = 0.;
        // learning rate for some parameters.
        var l2_decay = this.l2_decay * this.l2_decay_mul;
        var l1_decay = this.l1_decay * this.l1_decay_mul;
        for (let i = 0; i < N; i++) {
            let p = x[i];
            decay_loss += l2_decay * p * p / 2; // accumulate weight decay loss
            decay_loss += l1_decay * Math.abs(p);
            let l1grad = l1_decay * (p > 0 ? 1 : -1);
            let l2grad = l2_decay * (p);
            dx[i] -= (l2grad + l1grad);
        }
        return decay_loss;
    }

}

export { Regularization };
