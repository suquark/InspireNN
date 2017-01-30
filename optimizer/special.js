import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';

/**
 * SGD enjoys high learning rate. Suitable for t-SNE, etc
 */
class SpecialSGD extends grad_optimizer {
    constructor(len, opt={}) {
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

export { SpecialSGD };
