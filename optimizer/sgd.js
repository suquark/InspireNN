import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';

class SGD extends grad_optimizer {
    constructor(len, opt={}) {
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
                x[j] = - lr * g[j]; // step
            }
        }
    }
}

export { SGD };