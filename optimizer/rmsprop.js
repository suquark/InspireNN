import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';


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
    constructor(len, opt={}) {
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
export { RMSProp };
