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

        // using map will too slow for closure, etc ...
        var lgrad = new Array(plist.length);
        for (let i in plist) {
            let p = plist[i];
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
