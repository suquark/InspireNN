import { Vector } from 'backend/tensor.js';

function vectorize(elements, prep=x=>x.value) {
    let arr = elements.map(prep);
    let N = elements.length;
    let v = new Vector(N);  // TODO: after change into tensor, use `new Vector(N, arr)` instead
    for (let i = 0; i < N; i++) v.w[i] = arr[i];
    return v;
}

export { vectorize };
