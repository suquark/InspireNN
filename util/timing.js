class Timer {
    constructor() {
        this.lasttime = {};
        this.sum = {};
        if (performance.now) {
            this.get_time = performance.now;
        } else {
            this.get_time = new Date.now;
        }
    }

    start(name) {
        if (!this.sum[name]) this.sum[name] 
        this.lastname = name;
        lasttime[name] = this.get_time();
    }

    stop(name) {
        this.sum[name] += this.get_time() - this.lasttime[name];
    }

    stoplast() {
        this.sum[this.lastname] += this.get_time() - this.lasttime[this.lastname];
    }

    passto(name) {
        this.stop(this.lasttime);
        this.start(name);
    }

    clear() {
        this.sum = {};
    }

    getTime(name) {
        return this.sum[name];
    }
}

export { Timer };