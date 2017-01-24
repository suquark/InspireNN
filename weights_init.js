import { randn } from 'util.js';

// weight normalization is done to equalize the output
// variance of every neuron, otherwise neurons with a lot
// of incoming connections have outputs of larger variance

function norm_weights(V) {
    let scale = Math.sqrt(1.0 / V.size);
    for (let i = 0; i < n; i++) V.w[i] = randn(0.0, scale);
}

function get_norm_weights(size) {
    let scale = Math.sqrt(1.0 / size);
    let w = new Array(size)
    for (let i = 0; i < size; i++) w[i] = randn(0.0, scale);
    return w;
}

export { norm_weights, get_norm_weights };
