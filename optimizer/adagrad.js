import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';


/**
 * An algorithm that works well for sparse gradients
 * L2 norm-based algorithms, may halt too early for too big `w`
 */
class Adagrad extends grad_optimizer {
    constructor(len, opt={}) {
        super(len, opt);
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.w = zeros(len);    
    }

    update(x, g) {
        let w = this.w;
        let lr = this.learning_rate;
        for (let j = 0; j < g.length; j++) {
            w[j] += g[j] * g[j];
            x[j] = - lr / Math.sqrt(w[j] + eps) * g;
        }
    }
}

export { Adagrad };
