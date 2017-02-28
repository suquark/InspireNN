/**
 * Export optimizers
 */
import { getopt } from 'util.js';
import { zeros } from 'util/array.js';

const eps = 1e-8; // eps added for better conditioning

class grad_optimizer {
    constructor(len, opt = {}) {}
    optimize(T) { this.update(T.w, T.dw); }
    update(x, g) {}
    grad(g) {
        let dx = zeros(g.length);
        this.update(dx, g);
        return dx;
    }
}

/************************* Norm + Nesterov **************************/

/**
 * Nesterov Adam optimizer
 */
class Nadam extends grad_optimizer {
    constructor(len, opt = {}) {
        super(len, opt);
        this.k = 0;
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.beta1 = getopt(opt, 'beta1', 0.9);
        this.beta2 = getopt(opt, 'beta2', 0.999);
        this.v = zeros(len);
        this.w = zeros(len);
    }

    update(x, g) {
        ++this.k; // k > 0, or 1 / biasCorr will be NaN
        let v = this.v,
            w = this.w;
        let lr = this.learning_rate;
        let k = this.k;
        let beta1 = this.beta1,
            beta2 = this.beta2;
        /**
         * initialization bias correction terms, 
         * which offset some of the instability that initializing v and w to 0 can create.
         */
        let alpha1 = 1 - Math.pow(beta1, k);
        let alpha2 = 1 - Math.pow(beta2, k);

        // TODO: implement Nadam optimizer

    }
}

/********************************* Norm + Momentum *********************************/

/**
 * Adaptive moment estimation (Adam), combining
 * classical momentum (using a decaying mean instead of a decaying sum) 
 * with RMSProp to improve performance on a number of benchmarks.
 * 
 * References
 *      Adam - A Method for Stochastic Optimization (http://arxiv.org/abs/1412.6980v8)
 */
class Adam extends grad_optimizer {
    /** Adam update
     * u <- ( b^p * u + (1 - b^p) * g^p ) ^ (1/p) : k-moment estimate
     */
    constructor(len, opt = {}) {
        super(len, opt);
        this.k = 0;
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.lr_decay = getopt(opt, 'lr_decay', 0);
        this.beta1 = getopt(opt, 'beta1', 0.9);
        this.beta2 = getopt(opt, 'beta2', 0.999);
        this.v = zeros(len);
        this.w = zeros(len);
    }

    update(x, g) {
        ++this.k; // k > 0, or 1 / biasCorr will be NaN
        let v = this.v,
            w = this.w;
        let k = this.k;
        let lr = this.lr_decay > 0 ? this.learning_rate / (1 + this.lr_decay * k) : this.learning_rate;
        let beta1 = this.beta1,
            beta2 = this.beta2;
        /**
         * initialization bias correction terms, 
         * which offset some of the instability that initializing v and w to 0 can create.
         */
        let alpha1 = 1.0 - Math.pow(beta1, k);
        let alpha2 = 1.0 - Math.pow(beta2, k);

        for (let j = 0; j < g.length; j++) {
            v[j] = beta1 * v[j] + (1 - beta1) * g[j]; // update biased first moment estimate
            w[j] = beta2 * w[j] + (1 - beta2) * g[j] * g[j]; // update biased second moment estimate
            let biasCorr1 = v[j] / alpha1; // correct bias first moment estimate
            let biasCorr2 = w[j] / alpha2; // correct bias second moment estimate
            x[j] -= lr * biasCorr1 / (Math.sqrt(biasCorr2) + eps);
        }
    }
}

/**
 * AdaMax, a variant of Adam based on the infinity norm. 
 */
class Adamax extends grad_optimizer {
    constructor(len, opt = {}) {
        super(len, opt);
        this.k = 0;
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.beta1 = getopt(opt, 'beta1', 0.9);
        this.beta2 = getopt(opt, 'beta2', 0.999);
        this.v = zeros(len);
        this.w = zeros(len);
    }

    update(x, g) {
        ++this.k;
        let v = this.v,
            w = this.w;
        let lr = this.learning_rate;
        let k = this.k;
        let beta1 = this.beta1,
            beta2 = this.beta2;
        let alpha1 = 1 - Math.pow(beta1, k);
        let alpha2 = 1 - Math.pow(beta2, k);
        for (let j = 0; j < g.length; j++) {
            v[j] = beta1 * v[j] + (1 - beta1) * g[j]; // update biased first moment estimate
            w[j] = Math.max(beta2 * w[j], Math.abs(g[j])); // update biased infinity norm moment estimate
            x[j] -= lr / alpha1 * v[j] / (w[j] + eps);
        }
    }
}


class Adadelta extends grad_optimizer {
    constructor(len, opt = {}) {
        super(len, opt);
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.ro = getopt(opt, 'ro', 0.95);
        this.w = zeros(len);
        this.wx = zeros(len);
    }

    update(x, g) {
        let w = this.w;
        let wx = this.wx;
        let lr = this.learning_rate;
        let ro = this.ro;
        for (let j = 0; j < g.length; j++) {
            w[j] = ro * w[j] + (1 - ro) * g[j] * g[j];
            let dx = Math.sqrt(wx[j] + eps) * g[j] / (w[j] + eps);
            wx[j] = ro * wx[j] + (1 - ro) * dx * dx; // yes, wx behind w by 1.
            x[j] -= lr * dx;
        }
    }
}



/************************* Norm-based **************************/


/**
 * An algorithm that works well for sparse gradients
 * L2 norm-based algorithms, may halt too early for too big `w`
 */
class Adagrad extends grad_optimizer {
    constructor(len, opt = {}) {
        super(len, opt);
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.w = zeros(len);
    }

    update(x, g) {
        let w = this.w;
        let lr = this.learning_rate;
        for (let j = 0; j < g.length; j++) {
            w[j] += g[j] * g[j];
            x[j] = -lr / Math.sqrt(w[j] + eps) * g[j];
        }
    }
}


/**
 * RMSProp, an alternative to AdaGrad that replaces 
 * the sum in `w` with a decaying mean parameterized here by `\ro`. 
 * This allows the model to continue to learn indefinitely.
 * 
 * This optimizer is usually a good choice for recurrent neural networks.
 * 
 * References
        - [rmsprop: Divide the gradient by a running average of its recent magnitude](http://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec6.pdf)
 * 
 */
class RMSProp extends grad_optimizer {
    constructor(len, opt = {}) {
        super(len, opt);
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.ro = getopt(opt, 'ro', 0.9);
        this.w = zeros(len);
    }

    update(x, g) {
        let w = this.w;
        let lr = this.learning_rate;
        let ro = this.ro;
        for (let j = 0; j < g.length; j++) {
            w[j] = ro * w[j] + (1 - ro) * g[j] * g[j];
            x[j] -= lr * g[j] / Math.sqrt(w[j] + eps);
        }
    }
}



// Nesterov-based
class Nesterov extends grad_optimizer {
    constructor(len, opt = {}) {
        super(len, opt);
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.momentum = getopt(opt, 'momentum', 0.9);
        this.v = zeros(len);
    }

    update(x, g) {
        // FIXME: different from others' (e.g. Keras), check later?
        let v = this.v;
        let m = this.momentum;
        let lr = this.learning_rate;
        for (let j = 0; j < g.length; j++) {
            // += m * v - lr * g
            let v0 = v[j];
            v[j] = m * v0 + lr * g[j];
            x[j] += m * v0 - (1.0 + m) * v[j];
        }
    }
}

// Momentum-based
class SGD extends grad_optimizer {
    constructor(len, opt = {}) {
        super(len, opt);
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.momentum = getopt(opt, 'momentum', 0.9);
        this.v = zeros(len);
    }

    update(x, g) {
        let lr = this.learning_rate;
        let m = this.momentum;
        let v = this.v;
        if (m > 0.0) {
            for (let j = 0; j < g.length; j++) {
                // momentum update
                let vt = m * v[j] - lr * g[j];
                v[j] = vt; // back this up for next iteration of momentum
                x[j] += vt; // step
            }
        } else {
            // vanilla sgd
            for (let j = 0; j < g.length; j++) {
                // momentum update
                x[j] = -lr * g[j]; // step
            }
        }
    }
}



/**
 * SGD enjoys high learning rate. Suitable for t-SNE, etc
 */
class SpecialSGD extends grad_optimizer {
    constructor(len, opt = {}) {
        super(len, opt);
        this.learning_rate = getopt(opt, 'learning_rate', 10);
        this.v = zeros(len);
        this.gain = zeros(len);
        this.iter = 0;
    }

    update(x, g) {
        ++this.iter;
        let lr = this.learning_rate;
        let m = this.iter < 250 ? 0.5 : 0.8; // momentum
        let v = this.v;
        let gain = this.gain;

        for (let i = 0; i < g.length; i++) {
            // compute gain update
            let newgain = Math.sign(g[i]) === Math.sign(v[i]) ? gain[i] * 0.8 : gain[i] + 0.2;
            if (newgain < 0.01) newgain = 0.01; // clamp
            gain[i] = newgain; // store for next turn

            // compute momentum step direction
            let dx = m * v[i] - lr * newgain * g[i];
            v[i] = dx; // remember the step we took
            x[i] += dx; // step!
        }
    }
}


/************************ Second-Order **************************/

/**
 * L-BFGS optimizer
 */
class LBFGS extends grad_optimizer {

    constructor(len, opt = {}) {
        super(len, opt);

    }

    update(x, g) {
        // TODO: implement L-BFGS optimizer

    }
}

var optimizers = {
    'adam': Adam,
    'adamax': Adamax,
    'adagrad': Adagrad,
    'rmsprop': RMSProp,
    'adadelta': Adadelta,
    'nesterov': Nesterov,
    'sgd': SGD,
    'specialsgd': SpecialSGD
};

export default function(size, opt) {
    let name = getopt(opt, 'method', 'sgd');
    return new optimizers[name](size, opt);
};