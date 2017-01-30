import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';

class Nesterov extends grad_optimizer {
    constructor(len, opt={}) {
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

export { Nesterov };
