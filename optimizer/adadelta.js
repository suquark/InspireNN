import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';


class Adadelta extends grad_optimizer {
    constructor(len, opt={}) {
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
            let dx = Math.sqrt(wx[j]+ eps) * g[j] / (w[j] + eps);
            wx[j] = ro * wx[j]  + (1 - ro) * dx * dx; // yes, wx behind w by 1.
            x[j] -= lr * dx;
        }
    }
}

export { Adadelta };
