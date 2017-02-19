class Restrictor {
    constructor(clip=1.0) {
        this.clip = Math.abs(clip);
    }

    restrict(T) {
        let w = T.w, N = T.size;
        // clip weights
        for (let i = 0; i < N; i++) {
            if (w[i] > this.clip) w[i] = this.clip; else if (w[i] < -this.clip) w[i] = -this.clip;
        }
    }
}

export { Restrictor };