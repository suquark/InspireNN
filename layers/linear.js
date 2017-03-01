import { Layer } from 'layers/layer.js';
import { Vector, Tensor, getVolFromJSON } from 'backend/tensor.js';
import { shift, assign, matmuladd, add, radd, tdotadd } from 'backend/ops.js';
import { getopt } from 'util.js';

class LinearLayer extends Layer {

    constructor(opt) {
        opt.serialize = ['l1_decay_mul', 'l2_decay_mul', 'bias'];
        super('linear', opt);
        // required
        // ok fine we will allow 'filters' as the word as well
        this.out_depth = getopt(opt, ['num_neurons', 'filters']);
        // optional
        this.l1_decay_mul = getopt(opt, 'l1_decay_mul', 0.0);
        this.l2_decay_mul = getopt(opt, 'l2_decay_mul', 1.0);

        // initializations
        this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;

        this.W = new Tensor([this.num_inputs, this.out_depth]);
        this.W.allow_regl = true;

        this.bias = getopt(opt, 'bias', true);
        if (this.bias) {
            this.bias_perf = getopt(opt, 'bias_pref', 0.0);
            this.b = new Vector(this.out_depth);
            shift(this.b, this.bias_perf);
        }

        // record updated values for updating
        this.updated = [this.W, this.b];
    }

    forward(x, is_training) {
        this.in_act = x;
        if (!this.out_act) this.out_act = new Vector(this.out_depth);
        if (this.b)
            assign(this.out_act, this.b);
        else
            this.out_act.fill(0);
        matmuladd(this.out_act, this.in_act, this.W);
        return this.out_act;
    }

    backward(dy) {
        this.dy = dy;
        let x = this.in_act;
        if (this.b) radd(this.db, dy);
        tdotadd(this.dW, x, dy);
        this.dx += this.W * transpose(dy);
    }

    get trainables() {
        var response = [];
        if (this.trainable) {
            response.push(this.W);
            if (this.b) response.push(this.W);
        }
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

export { LinearLayer };