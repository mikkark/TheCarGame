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
        this.speed = 0;
        this.engine = engine;
        this.steering = new Steering(1);
        this.maxspeed = maxspeed;
        this.currentPresumedSpeed = 0;
    }

    Car.prototype.accelerate = function () {
        this.engine.giveRevs();
    };

    Car.prototype.break = function () {
        this.engine.revsDown();
        this.currentPresumedSpeed = 0;
    };

    Car.prototype.setCurrentSpeed = function () {
        this.currentPresumedSpeed = Math.round((this.maxspeed / model.MAX_GEARS) * this.engine.gear * (this.engine.revs / this.engine.maxRevs));
    };

    function Engine(enginetype, maxRevs, revMap) {
        this.engineType = enginetype;
        this.maxRevs = maxRevs;
        this.revMap = revMap;
        this.revs = 0;
        this.gear = 1;
    }

    addRevs = function (engine) {
        engine.revs = engine.revs + (((engine.revMap - (engine.revMap * ((engine.gear - 1) / model.MAX_GEARS))) / 100) * engine.maxRevs);
    };

    Engine.prototype.giveRevs = function () {
        if (this.revs < this.maxRevs) {
            addRevs(this);
        } else if (this.gear < model.MAX_GEARS) {
            this.gear = this.gear + 1;
            this.revs = this.revs - (this.maxRevs * 0.5);
        }
    };

    Engine.prototype.revsDown = function () {
        this.revs = 0;
        this.gear = 1;
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