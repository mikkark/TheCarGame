'use strict'

const MAXPOWER = 100; //percentage
const SLOWEST_MOVEMENT_DELAY = 2000; //ms

function Device (name, x, y, gas) {
    this.name = name;
    this.X = x;
    this.Y = y;
    this.gas = gas;
    this.speed = 0;
}

/*
Device.prototype.speed = Device.prototype.speed || function() {
    this.speedObs = this.speedObs || new Rx.Subject();

    return this.speedObs;
};
*/

Device.prototype.accelerate = function() {
//    console.log('device ' + this.name + ' accelerating');

    if (this.speed < MAXPOWER) {
        this.speed = this.speed + 5;
    }

//    window.dispatchEvent(new CustomEvent('acceleration', { detail: { name: this.name, speed: this.speed }, bubbles: false, cancelable: false}));
};

Device.prototype.break = function() {
    this.speed = 0;
};

/*
   Converts power to movement delay, i.e. how many milliseconds does it take to move one pixel.

   param: powerPercentage, current power output as a percentage of full power (max 100, min 10).
 */
function convertPowerToMovementSpeed(powerPercentage) {
    return SLOWEST_MOVEMENT_DELAY / (powerPercentage / 10);
}