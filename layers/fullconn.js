import { Layer } from 'layers/layer.js';
import { Vol, createVector, createMatrix, getVolFromJSON } from 'vol.js';
import {getopt} from 'util.js';

class FullyConnLayer extends Layer {

    constructor (opt) {
        opt.serialize = ['l1_decay_mul', 'l2_decay_mul'];
        super('fc', opt);
        // required
        // ok fine we will allow 'filters' as the word as well
        this.out_depth = getopt(opt, ['num_neurons', 'filters']);
        // optional
        this.l1_decay_mul = getopt(opt, 'l1_decay_mul', 0.0);
        this.l2_decay_mul = getopt(opt, 'l2_decay_mul', 1.0);

        // initializations
        this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
        let bias = getopt(opt, 'bias_pref', 0.0);
        
        this.filters = createMatrix(this.out_depth, this.num_inputs);
        this.filters.forEach((V) => { V.allow_regl = true; });
        this.biases = createVector(this.out_depth, bias);
        // record updated values for updating
        this.updated = this.filters.concat([this.biases]);
    }

    forward(V, is_training) {
        this.in_act = V;
        let A = new Vol(1, 1, this.out_depth, 0.0);
        let Vw = V.w;
        for (let i = 0; i < this.out_depth; i++) {
            let a = 0.0;
            let wi = this.filters[i].w;
            for (let d = 0; d < this.num_inputs; d++) {
                a += Vw[d] * wi[d]; // for efficiency use Vols directly for now
            }
            a += this.biases.w[i];
            A.w[i] = a;
        }

        // TODO: patch this:
        // TensorVectorProduct(this.out_act, this.filters, this.in_act);
        // if (this.biases) TensorAdd_s(this.out_act, this.biases);

        this.out_act = A;
        return this.out_act;
    }

    backward() {
        let V = this.in_act;
        V.dw.fill(0.); // zero out the gradient in input Vol
        
        // compute gradient wrt weights and data
        for (let i = 0; i < this.out_depth; i++) {
            let tfi = this.filters[i];
            let chain_grad = this.out_act.dw[i];
            for(let d = 0; d < this.num_inputs; d++) {
                V.dw[d] += tfi.w[d] * chain_grad; // grad wrt input data
                tfi.dw[d] += V.w[d] * chain_grad; // grad wrt params
            }
            this.biases.dw[i] += chain_grad;
        }

        // TransposedTensorVectorProductAdd(this.in_act, this.filters, this.out_act@dw)
        // VectorProductAdd(this.filters, this.in_act, this.out_act@dw)
        // TensorAdd_s(this.biases, this.out_act@dw) 
    }

    get trainables() {
        let response = this.filters.slice();
        response.push(this.biases); 
        return response;
    }

    toJSON() {
        var json = super.toJSON();
        json.filters = this.filters.map(x => x.toJSON());
        json.biases = this.biases.toJSON();
        return json;
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.l1_decay_mul = getopt(json, 'l1_decay_mul', 0.0);
        this.l2_decay_mul = getopt(json, 'l2_decay_mul', 1.0);
        
        this.filters = json.filters.map(getVolFromJSON);
        this.filters.forEach((V) => { V.allow_regl = true; });
        this.biases = getVolFromJSON(json.biases);
        // record updated values for updating
        this.updated = this.filters.concat([this.biases]);
    }
}

export { FullyConnLayer };
