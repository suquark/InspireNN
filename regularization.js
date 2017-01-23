

class Regularization {
    
    constructor (l2_decay = 0., l1_decay = 0.) { 
        this.l2_decay = l2_decay;
        this.l1_decay = l1_decay;
    }

    clear_loss() {
        this.l2_decay_loss = 0.0;
        this.l1_decay_loss = 0.0;
    }

    get_punish(plist, l2_decay_mul = 1.0, l1_decay_mul = 1.0) {
        // learning rate for some parameters.
        var l2_decay = this.l2_decay * l2_decay_mul;
        var l1_decay = this.l1_decay * l1_decay_mul;
        // may map will not be too slow ...
        return plist.map(function(p) {
            l2_decay_loss += l2_decay * p * p / 2; // accumulate weight decay loss
            l1_decay_loss += l1_decay * Math.abs(p);
            var l1grad = l1_decay * (p > 0 ? 1 : -1);
            var l2grad = l2_decay * (p);
            return l2grad + l1grad;
        });
    }
}
