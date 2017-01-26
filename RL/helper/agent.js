import { Face } from './geometry.js';
import { Digestion } from './sensors/digestion.js';
import { MultiEyes } from './sensors/naive_eye.js';
import { TwoWheelMotor } from './effector/motor.js';

class Agent {

    // A single agent
    constructor(brain) {
        // positional information
        // (50, 50) rad = 10, angle = 0
        this.face = new Face(50, 50, 10, 0);

        this.motor = new TwoWheelMotor(this.face);
        this.eyes = new MultiEyes(this.face);

        // 9 eyes
        this.eyes.setup_array(-0.75, 0.25, 9);
        this.digest = new Digestion(
            { 'type': {1: 5.0, 2: -6.0} }, 
            { 'alive': false }
        );
        // braaain
        //this.brain = new deepqlearn.Brain(this.eyes.length * 3, this.actions.length);
        // var spec = document.getElementById('qspec').value;
        // eval(spec);

        this.brain = brain;  // maybe nothing
        this.reward_bonus = 0.0;
        this.prevactionix = -1;
    }

    get position() { return this.face.origin; }
    get circle() { return this.face.circle; }
    get rad() { return this.face.rad; }

    move(face) {
        // important! Otherwise we will lost track of pointer to face
        this.face.update(face);
    }

    get reward() {
        // compute reward to brain
    
        // agents dont like to see walls, especially up close
        let proximity_reward = 2.0 * this.eyes.average_distance(0);
        if (proximity_reward > 1.0) proximity_reward = 1.0;

        // agents like to go straight forward
        var forward_reward = 0.0;
        if (this.actionix === 0 && proximity_reward > 0.75) forward_reward = 0.1 * proximity_reward;

        // agents like to eat good things
        let digestion_reward = 1.0 * this.digest.checkout;

        // sum of rewards
        let reward = proximity_reward + forward_reward + digestion_reward;
        return reward;
    }

    get signal() {
        // create input to brain
        return this.eyes.signal();
    }

    reaction() {
        // post reaction to environment
        return this.motor.steer(this.action);
    }

    forward() {
        // in forward pass the agent simply behaves in the environment
        // get action from brain
        this.action = this.brain.forward(this.signal);
    }

    backward() {
        // in backward pass agent learns.
        // pass to brain for learning
        this.brain.backward(this.reward);
    }

    draw_body(ctx) {
        // draw agents
        // color agent based on reward it is experiencing at the moment
        var r = Math.floor(this.brain.latest_reward * 200);
        r = clip(r, 0, 255);

        ctx.fillStyle = "rgb(" + r + ", 150, 150)";
        ctx.strokeStyle = "rgb(0,0,0)";
    
        // draw agents body
        this.face.draw(ctx);
    }

    draw(ctx) {
        this.draw_body(ctx);
        // draw agents sight
        this.eyes.draw();
    }

}

