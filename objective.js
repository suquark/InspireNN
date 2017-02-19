import { zeros } from 'util/array.js';
const eps = 1e-8;
/**
 * mean squared error
 * @param {x} - output layer tensor
 * @param {y} - label tensor
 */
function meanSquaredError(x, y) {
    let N = x.size;
    let loss = 0.;
    let xw = x.w, yw = y.w, xdw = x.dw;
    for (let i = 0; i < N; i++) {
        let dx = xw[i] - yw[i];
        xdw[i] += dx;
        loss += 0.5 * dx * dx;
    }
    return loss;
}

/**
 * mean absolute error
 * @param {x} - output layer tensor
 * @param {y} - label tensor
 */
function meanAbsoluteError(x, y) {
    let N = x.size;
    let loss = 0.;
    let xw = x.w, yw = y.w, xdw = x.dw;
    for (let i = 0; i < N; i++) {
        let dx = xw[i] - yw[i];
        xdw[i] += Math.sign(dx);
        loss += Math.abs(dx);
    }
    return loss;
}

/**
 * KL divergence
 * @param {x} - output tensor
 * @param {y} - label tensor
 */
function KLD(x, y) {
    let N = x.size;
    let loss = 0.;
    let xw = x.w, yw = y.w, xdw = x.dw;

    for (let i = 0; i < N; i++) {
        let Pi = xw[i], Qi = yw[i];
        let logpq = Math.log2(Pi / Qi + eps);
        xdw[i] += 1.0 + logpq;
        loss += Pi * logpq;
    }

    return loss;
}




/**
 * Jensen–Shannon divergence
 * M = 0.5(P + Q)
 * JS(P, Q) = 0.5 * KL( P || M ) + 0.5 * KL( Q || M )
 * @param {x} - output tensor
 * @param {y} - label tensor
 */
function JSD(x, y) {
    let N = x.size;
    let loss = 0.;
    let mw = zeros(N);
    let xw = x.w, yw = y.w, xdw = x.dw;

    for (let i = 0; i < N; i++) {
        mw[i] = 0.5 * (xw[i] + yw[i]);
    }

    for (let i = 0; i < N; i++) {
        let Pi = xw[i], Qi = yw[i], Mi = mw[i];
        let logpm = Math.log2(Pi / Mi + eps);
        let logqm = Math.log2(Qi / Mi + eps);
        xdw[i] += 0.5 * logpm;
        loss += 0.5 * (Pi * logpm + Qi * logqm);
    }

    return loss;
}


/**
 * cosine distance
 * @param {x} - output tensor
 * @param {y} - label tensor
 */
function cosine(x, y) {
    let N = x.size;
    let loss = 0.;
    let xw = x.w, yw = y.w, xdw = x.dw;
    let modx = 0., mody = 0.;
    for (let i = 0; i < N; i++) {
        modx += xw[i] * xw[i];
        mody += yw[i] * yw[i];
    }
    modx = Math.sqrt(modx); 
    mody = Math.sqrt(mody);
    
    for (let i = 0; i < N; i++) {
        let Xi = xw[i], Yi = yw[i];
        let normx = Xi / modx;
        let normy = Yi / mody;
        xdw[i] += normy * (normx * normx - 1) / modx;
        loss += normx * normy;
    }
    
    return 1 - loss;
}


/**
 * SVM loss / Hinge loss
 * @param {x} - output tensor
 * @param {y} - case id
 */
function hingeLoss(x, y) {
    let N = x.size, xw = x.w, xdw = x.dw;
    // xdw.fill(0.); // zero out the gradient of input Vol

    // we're using structured loss here, which means that the score
    // of the ground truth should be higher than the score of any other 
    // class, by a margin
    let yscore = xw[y]; // score of ground truth
    let margin = 1.0;
    let loss = 0.0;
    for (let i = 0; i < N; i++) {
        if (y === i) continue; 
        let ydiff = -yscore + xw[i] + margin;
        if (ydiff > 0) {
            // violating dimension, apply loss
            xdw[i] += 1;
            xdw[y] -= 1;
            loss += ydiff;
        }
    }
    return loss;
}


/**
 * Multi-class logarithmic loss
 * @param {x} - output tensor
 * @param {y} - case id
 */
function sparseMulticlassLogarithmicLoss(x, y) {
    let N = x.size, xw = x.w, xdx = x.dw;
    for (let i = 0; i < N; i++) {
        xdw[i] = 1.0 / ((i === y ? 0.0 : 1.0) - xw[i]);
    }
    // loss is the class negative log likelihood
    return -Math.log(xw[i]);
}


/**
 * Sparse softmax entropy
 * @param {x} - output tensor
 * @param {y} - case id
 */
function sparseSoftmaxLoss(x, y) {
    x.softmax_a(x.dw);
    let v = x.dw[y];
    x.dw[y] -= 1.0;
    // loss is the class negative log likelihood
    return -Math.log(v);
}

export { meanSquaredError, hingeLoss, sparseMulticlassLogarithmicLoss, sparseSoftmaxLoss, KLD, JSD };

export default function(name='mse') {
    let dict = {
        'mse' : meanSquaredError,
        'mae': meanAbsoluteError,
        'hinge': hingeLoss,
        'mclog': sparseMulticlassLogarithmicLoss,
        'softmax': sparseSoftmaxLoss,
        'kld': KLD,
        'jsd': JSD
    }
    return dict[name];
};

