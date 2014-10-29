var createModel;
createModel = function () {
    'use strict';

    var addRevs;
    var model = {};

    model.MAX_GEARS = 6;
    model.STEERING_SAMPLING_RATE = 10;
    model.MOVING_RATE = 1;
    model.UNIT_OF_MOVEMENT = 1; //pixels per 15ms
    model.GAS_PEDAL_SAMPLING_RATE = 15;
    model.CHECKPOINT_CHECK_RATE = 100;

    function Car(name, keys, engine, maxspeed) {
        this.name = name;
        this.gas = keys.gas;
        this.left = keys.left;
        this.right = keys.right;
        this.gearUp = keys.gearUp;
        this.speed = 0;
        this.engine = engine;
        this.steering = new Steering(1);
        this.maxspeed = maxspeed;
        this.currentPresumedSpeed = 0;
        this.gearbox = new Gearbox(model.MAX_GEARS);
    }

    Car.prototype.accelerate = function () {
        if (this.engine.revs < this.engine.maxRevs) {
            this.engine.giveRevs(this.gearbox);
        } else if (this.gearbox.currentGear > 0 && this.gearbox.currentGear < this.gearbox.maxGears) {
            this.gearbox.currentGear = this.gearbox.currentGear + 1;
            this.engine.revs = this.engine.revs - (this.engine.maxRevs * 0.5);
        }
    };

    Car.prototype.break = function () {
        this.engine.revsDown();
        this.gearbox.currentGear = 1;
        this.currentPresumedSpeed = 0;
    };

    Car.prototype.setCurrentSpeed = function () {
        this.currentPresumedSpeed = Math.round((this.maxspeed / this.gearbox.maxGears) * this.gearbox.currentGear * (this.engine.revs / this.engine.maxRevs));
    };

    Car.prototype.changeUp = function () {
        this.engine.revs = this.engine.revs - (this.engine.maxRevs * 0.5);
        this.gearbox.currentGear = this.gearbox.currentGear + 1;
    };

    function Gearbox(maxGears) {
        this.maxGears = maxGears;
        this.currentGear = 0; //= neutral.
    }

    function Engine(enginetype, maxRevs, revMap) {
        this.engineType = enginetype;
        this.maxRevs = maxRevs;
        this.revMap = revMap;
        this.revs = 0;
    }

    Engine.prototype.giveRevs = function (gearbox) {
        this.revs = this.revs + (((this.revMap - (this.revMap * ((gearbox.currentGear - 1) / gearbox.maxGears))) / 100) * this.maxRevs);
    };

    Engine.prototype.revsDown = function () {
        this.revs = 0;
    };

    function Steering(turn) {
        this.maxAngle = 5;
        this.turn = turn / 10;
        this.angle = 0; //+ or - maxAngle, 0 is straight.
    }

    Steering.prototype.turnLeft = function () {
        if (this.angle > -(this.maxAngle) &&
                this.angle <= this.maxAngle) {
            this.angle -= this.turn;
        }
    };

    Steering.prototype.turnRight = function () {
        if (this.angle < this.maxAngle &&
                this.angle >= -(this.maxAngle)) {
            this.angle += this.turn;
        }
    };

    Steering.prototype.center = function () {
        this.angle = 0;
    };

    model.Steering = Steering;
    model.Car = Car;
    model.Engine = Engine;

    return model;
};

var model = createModel();