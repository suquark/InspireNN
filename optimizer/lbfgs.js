import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';


/**
 * L-BFGS optimizer
 */
class LBFGS extends grad_optimizer {
   
    constructor(len, opt={}) {
        super(len, opt);
        
    }

    update(x, g) {
        // TODO: implement L-BFGS optimizer

    }
}

export { LBFGS };
