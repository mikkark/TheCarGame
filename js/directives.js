'use strict'

app.directive('track', function () {
    return {
        templateNamespace: 'svg',
        //template: '<svg height="800" style="display: inline-block" width="60%" ng-transclude></svg>',
        templateUrl: './html/track2.html',
        restrict: 'E',
        replace: true,
        transclude: true
    };
});

app.directive('powermeter', function () {
    return {
        template: '<div style="height: {{(car.engine.revs/car.engine.maxRevs)*100}}px;background-color: red"></div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('speedometer', function () {
    return {
        template: '<div>speed:{{car.currentPresumedSpeed}}</div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('gearbox', function () {
    return {
        template: '<div>gear:{{car.gearbox.currentGear}} (gear up: {{car.keys.gearUpString}})</div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('steering', function () {
    return {
        template: '<div>angle:{{car.steering.angle.toFixed(4)}}</div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('startlights', function () {
    return {
        templateUrl: './html/startlights.html',
        restrict: 'E',
        replace: true,
        transclude: true,
        controller: 'startlightscontroller'
    };
});

app.directive('car', function () {
    return {
        templateNamespace: 'svg',
        restrict: 'E',
        replace: true,
        template: '<svg viewBox="-20 -30 1200 900" ng-include="getTemplate(car.name)" onload="htmlLoaded()"></svg>',
        link: function (scope, element) {

            var car = scope.car;

            scope.getTemplate = function (name) {
                if (name === 'ferrari') {
                    return './html/carTemplate.html';
                } else {
                    return './html/carTemplate2.html';
                }
            };

            scope.htmlLoaded = function () {
                var right = $('#rightFront', element[0].nextSibling);
                var left = $('#leftFront', element[0].nextSibling);

                car.rightTyreCenterY = Number(right.attr('y1')) + ((Number(right.attr('y2')) - Number(right.attr('y1'))) / 2);
                car.rightTyreCenterX = Number(right.attr('x1')) + ((Number(right.attr('x2')) - Number(right.attr('x1'))) / 2);

                car.leftTyreCenterY = Number(left.attr('y1')) + ((Number(left.attr('y2')) - Number(left.attr('y1'))) / 2);
                car.leftTyreCenterX = Number(left.attr('x1')) + ((Number(left.attr('x2')) - Number(left.attr('x1'))) / 2);
            };

            var keyup = Rx.Observable.fromEvent(document, 'keyup');
            var keydown = Rx.Observable.fromEvent(document, 'keydown');

            var gasKeyFilter = function (kbevent) {
                return kbevent.which === car.keys.gas;
            };
            var steerLeftFilter = function (kbevent) {
                return kbevent.which === car.keys.left;
            };
            var steerRightFilter = function (kbevent) {
                return kbevent.which === car.keys.right;
            };
            var gearUpFilter = function (kbevent) {
                return kbevent.which === car.keys.gearUp;
            };

            //TODO: I haven't modeled the entire gearbox yet, so I just want one gear-up (= up from N) in the game.
            keydown.filter(gearUpFilter).take(1).subscribe(function () {
                car.changeUp();
                scope.$apply();
            });

            keydown.filter(gasKeyFilter)
                .take(1)
                .selectMany(function () {
                    return Rx.Observable.interval(0, model.GAS_PEDAL_SAMPLING_RATE)
                        .takeUntil(keyup.filter(gasKeyFilter))
                        .takeWhile(function () { return scope.car.currentPresumedSpeed < scope.car.maxspeed; });
                })
                .repeat()
                .subscribe(function () {
                    car.accelerate();
                    scope.$apply();
                });

            var turnLeft = keydown.filter(steerLeftFilter).select(function (kb) {
                return kb.keyCode;
            })
                .take(1)
                .takeWhile(function () { return car.steering.angle > -(car.steering.maxAngle); })
                .selectMany(function (keyCode) {
                    return Rx.Observable.interval(0, model.STEERING_SAMPLING_RATE)
                        .select(function () { return keyCode; })
                        .takeUntil(keyup.filter(steerLeftFilter))
                        .takeWhile(function () { return car.steering.angle > -(car.steering.maxAngle); });
                })
                .repeat();

            turnLeft.subscribe(function () {
                car.steering.turnLeft();
                scope.$apply();
            });

            var turnRight = keydown.filter(steerRightFilter).select(function (kb) {
                return kb.keyCode;
            })
                .take(1)
                .takeWhile(function () { return car.steering.angle < car.steering.maxAngle; })
                .selectMany(function (keyCode) {
                    return Rx.Observable.interval(0, model.STEERING_SAMPLING_RATE)
                        .select(function () { return keyCode; })
                        .takeUntil(keyup.filter(steerRightFilter))
                        .takeWhile(function () { return car.steering.angle < car.steering.maxAngle; });
                })
                .repeat();

            turnRight.subscribe(function () {
                car.steering.turnRight();
                scope.$apply();
            });

            var centerSteeringSubscription = function () {
                car.steering.center();
                scope.$apply();
            };

            keyup.filter(steerLeftFilter).subscribe(centerSteeringSubscription);
            keyup.filter(steerRightFilter).subscribe(centerSteeringSubscription);

            keyup.filter(gasKeyFilter).subscribe(function () {
                car.break();
                scope.$apply();
            });
        }
    };
});

app.directive('movingobject', ['observeOnScope', 'checkpointService', function(observeOnScope, checkpointService) {

    var moveToStartPos = function (car, movingElement) {
        var freeStartPos = $('[carstartpos=""]').first();

        freeStartPos.attr('carstartpos', car.name);

        var carMainRect = $('.carMainRect', movingElement);
        movingElement.carCenterX = Number(carMainRect.attr('x')) + (Number(carMainRect.attr('width')) / 2);
        movingElement.carCenterY = Number(carMainRect.attr('y')) + (Number(carMainRect.attr('height')) / 2);

        var newX = Number(freeStartPos.attr('cx')) - movingElement.carCenterX;
        var newY = Number(freeStartPos.attr('cy')) - movingElement.carCenterY;

        //These are dynamically added helper properties. With these I don't need to parse the current value
        //when I change the transform value.
        car.X = newX;
        car.Y = newY;

        movingElement.attr('transform', 'translate ( ' + newX + ' ' + newY + ')');

        console.log('transforming');
    };

    return {
        link: function (scope, element) {

            var currX, currY, newX, newY, newAngle;

            moveToStartPos(scope.car, element);

            scope.car.direction = 0;
            scope.car.timestamp = 0;

            var revs = observeOnScope(scope, 'car.engine.revs')
                .filter(function (revs) { return revs.newValue > 0; })
                .take(1)
                .selectMany(function () {
                    return Rx.Observable.interval(model.MOVING_RATE)
                        .takeWhile(function () { return checkpointService.isRaceOn() &&
                                                        scope.car.gearbox.currentGear > 0 &&
                                                        scope.car.engine.revs > 0; });
                })
                .repeat();

            var toRadians = function (angle) {
                return angle * (Math.PI / 180);
            };

            revs.sample(model.STEERING_SAMPLING_RATE).subscribe(function () {
                newAngle = scope.car.direction + scope.car.steering.angle;

                if (newAngle > 360) { newAngle = newAngle - 360; }
                if (newAngle < -360) { newAngle = newAngle + 360; }

                scope.car.direction = newAngle;
            });

            revs.subscribe(function () {
                currX = scope.car.X;
                currY = scope.car.Y;

                newY = (Math.sin(toRadians(scope.car.direction)) * model.UNIT_OF_MOVEMENT) + currY;
                newX = (Math.cos(toRadians(scope.car.direction)) * model.UNIT_OF_MOVEMENT) + currX;

                element.attr('transform', 'translate ( ' + newX + ' ' + newY + ')');

                scope.car.X = newX;
                scope.car.Y = newY;

                scope.car.nextCheckpointCtrl.checkIfCheckpointCrossed(scope.car, currX, currY, newX, newY);

                scope.car.setCurrentSpeed();

                scope.$apply();
            });
        }
    };
}]);

app.directive('checkpoint', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: true,
        controller: 'cpController'
    };
});

app.directive('carstartpos', function () {
    return {
        restrict: 'A',
        replace: true,
        link: function (scope, element) {
            element.hide();
        }
    };
});

app.directive('lapcount', ['checkpointService',  function (checkpointService) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            carname: '=carname'
        },
        template: '<div>' +
                    '<div>lap:{{lap}}. last:{{lastLapTime}}s. best:{{bestLapTime}}</div>' +
                    '<div ng-repeat="checkpointtime in checkpointtimes">' +
                        '<div>{{checkpointtime}}</div>' +
                    '</div>' +
                  '</div>',
        link: function (scope) {
            scope.lap = 1;
            scope.checkpointtimes = [];

            var stillLapsToGo = function () {
                return scope.lap <= checkpointService.numberOfLaps;
            };

            var myStream = checkpointService.lapPubSubject
                .filter(function (item) { return item.name === scope.carname || item.name === 'raceStart'})
                .takeWhile(stillLapsToGo);
            var finishLine = myStream
                .filter(function (item) { return item.id === checkpointService.numberOfCheckpoints; });

            finishLine.subscribe(function () {
                scope.lap = scope.lap + 1;
            });

            var aggregated = myStream.takeUntil(finishLine).aggregate(0, function(acc, data) {
                if (acc === 0) {
                    return data.time;
                } else if (data.id === checkpointService.numberOfCheckpoints) {
                    return data.time - acc;
                }
                else {
                    scope.checkpointtimes.push((data.time - acc) / 1000);
                    return acc;
                }
            }).repeat();

            var lapSubject = new Rx.Subject();

            aggregated.subscribe(function (elapsedTime) {
                scope.lastLapTime = elapsedTime / 1000;
                scope.checkpointtimes = [];

                lapSubject.onNext(elapsedTime);
            });

            //Stop scanning when laps are up, otherwise we would get a zero here that would reset the best time.
            var bestLapTime = lapSubject.takeWhile(stillLapsToGo).scan(0, function (acc, lapTime) {
                if (lapTime < acc || acc === 0) {
                    return lapTime;
                } else {
                    return acc;
                }
            });

            bestLapTime.subscribe(function (bestLapTime) {
                scope.bestLapTime = bestLapTime;
                scope.$apply();
            });
        }
    };
}]);