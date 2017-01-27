import {getopt} from 'util.js';
const eps = 1e-8;

// gsum: last iteration gradients (used for momentum calculations)
// xsum: used in adam or adadelta

class Adam {
    // adam update
    constructor(len, opt={}) {
        this.k = 0;
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.beta1 = getopt(opt, 'beta1', 0.9);
        this.beta2 = getopt(opt, 'beta2', 0.999);
        this.gsum = new Array(len).fill(0);
        this.xsum = new Array(len).fill(0);
    }

    grad(g) {
        ++this.k;
        let dx = new Array(g.length);
        for (let j = 0; j < g.length; j++) {
            this.gsum[j] = this.gsum[j] * this.beta1 + (1 - this.beta1) * g[j]; // update biased first moment estimate
            this.xsum[j] = this.xsum[j] * this.beta2 + (1 - this.beta2) * g[j] * g[j]; // update biased second moment estimate
            let biasCorr1 = this.gsum[j] * (1 - Math.pow(this.beta1, this.k)); // correct bias first moment estimate
            let biasCorr2 = this.xsum[j] * (1 - Math.pow(this.beta2, this.k)); // correct bias second moment estimate
            dx[j] =  -this.learning_rate * biasCorr1 / (Math.sqrt(biasCorr2) + eps);
        }
        return dx;
    }
}

class Adagrad {
    
    constructor(len, opt={}) {
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.gsum = new Array(len).fill(0);    
    }

    grad(g) {
        // adagrad update 
        let dx = new Array(g.length);
        for (let j = 0; j < g.length; j++) {
            this.gsum[j] += g[j] * g[j];
            dx[j] = - this.learning_rate / Math.sqrt(gsum[j] + eps) * g;
        }
        return dx;
    }
}

class Windowgrad {
    // this is adagrad but with a moving window weighted average
    // so the gradient is not accumulated over the entire history of the run. 
    // it's also referred to as Idea #1 in Zeiler paper on Adadelta. Seems reasonable to me!
    constructor(len, opt={}) {
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.ro = getopt(opt, 'ro', 0.95);
        this.gsum = new Array(len).fill(0);
    }

    grad(g) {
        // adagrad update 
        let dx = new Array(g.length);
        for (let j = 0; j < g.length; j++) {
            this.gsum[j] = this.ro * this.gsum[j] + (1 - this.ro) * g[j] * g[j];
            // eps added for better conditioning
            dx[j] = - this.learning_rate / Math.sqrt(this.gsum[j] + eps) * g[j];
        }
        return dx;
    }
}

class Adadelta {

    constructor(len, opt={}) {
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.ro = getopt(opt, 'ro', 0.95);    
        this.gsum = new Array(len).fill(0);
    }

    grad(g) {
        // adagrad update 
        let dx = new Array(g.length);
        for (let j = 0; j < g.length; j++) {
            let gij = g[j];
            this.gsum[j] = this.ro * this.gsum[j] + (1 - this.ro) * gij * gij;
            dx[j] = - Math.sqrt((this.xsum[j] + eps) / (this.gsum[j] + eps)) * gij;
            this.xsum[j] = this.ro * this.xsum[j] + (1 - this.ro) * dx[j] * dx[j]; // yes, xsum lags behind gsum by 1.
        }
        return dx;
    }
}

class Nesterov {

    constructor(len, opt={}) {
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.momentum = getopt(opt, 'momentum', 0.9);
        this.gsumi = new Array(len).fill(0);
    }

    grad(g) {
        // adagrad update 
        let dx = new Array(g.length);
        for (let j = 0; j < g.length; j++) {
            let gij = g[j];
            let d = gsumi[j];
            this.gsumi[j] = this.gsumi[j] * this.momentum + this.learning_rate * gij;
            dx[j] = this.momentum * d - (1.0 + this.momentum) * this.gsumi[j];
        }
        return dx;
    }
}

class SGD {

    constructor(len, opt={}) {
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.momentum = getopt(opt, 'momentum', 0.9);
        this.gsumi = new Array(len).fill(0);
    }

    grad(g) {
        // adagrad update 
        let dx = new Array(g.length);
        if (this.momentum > 0.0) {
            for (let j = 0; j < g.length; j++) {
                // momentum update
                dx[j] = this.momentum * this.gsumi[j] - this.learning_rate * g[j]; // step
                this.gsumi[j] = dx[j]; // back this up for next iteration of momentum
            }
        } else {
            // vanilla sgd
            for (let j = 0; j < g.length; j++) {
                // momentum update
                dx[j] = - this.learning_rate * g[j]; // step
            }
        }
        return dx;
    }
}

var optimizers = {
    'adam': Adam,
    'adagrad': Adagrad,
    'windowgrad': Windowgrad,
    'adadelta': Adadelta,
    'nesterov': Nesterov,
    'sgd': SGD
};

export function get_optimizer(size, opt) {
    let name = getopt(opt, 'method', 'sgd');
    return new optimizers[name](size, opt);
};
