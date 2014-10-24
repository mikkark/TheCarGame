'use strict'

app.directive('track', function () {
    return {
        templateNamespace: 'svg',
        //template: '<svg height="800" style="display: inline-block" width="60%" ng-transclude></svg>',
        templateUrl: './html/track1.svg',
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
        template: '<div>speed:{{car.engine.currentPresumedSpeed}}, actual:{{car.actualSpeed}}</div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('gearbox', function () {
    return {
        template: '<div>gear:{{car.engine.gear}}</div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('steering', function () {
    return {
        template: '<div>angle:{{car.steering.angle}}</div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('car', function () {
    return {
        templateNamespace: 'svg',
        templateUrl: './html/carTemplate.html',
        restrict: 'E',
        replace: true,
        transclude: true,
        link: function (scope, element) {

            var car = scope.car;
            car.accelerationTimestamp = 0;

            var right = $('#rightFront', element);
            var left = $('#leftFront', element);

            car.rightTyreCenterY = Number(right.attr('y1')) + ((Number(right.attr('y2')) - Number(right.attr('y1'))) / 2);
            car.rightTyreCenterX = Number(right.attr('x1')) + ((Number(right.attr('x2')) - Number(right.attr('x1'))) / 2);

            car.leftTyreCenterY = Number(left.attr('y1')) + ((Number(left.attr('y2')) - Number(left.attr('y1'))) / 2);
            car.leftTyreCenterX = Number(left.attr('x1')) + ((Number(left.attr('x2')) - Number(left.attr('x1'))) / 2);

            var keyup = Rx.Observable.fromEvent(document, 'keyup');
            var keydown = Rx.Observable.fromEvent(document, 'keydown');

            var gasKeyFilter = function (kbevent) {
                return kbevent.key === car.gas;
            };
            var steerLeftFilter = function (kbevent) {
                return kbevent.key === car.left;
            };
            var steerRightFilter = function (kbevent) {
                return kbevent.key === car.right;
            };

            keydown.filter(gasKeyFilter)
                .take(1)
                .selectMany(function () {
                    return Rx.Observable.interval(0, model.GAS_PEDAL_SAMPLING_RATE)
                        .takeUntil(keyup.filter(gasKeyFilter))
                        .takeWhile(function () { return scope.car.engine.currentPresumedSpeed < scope.car.engine.maxSpeed; });
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

app.directive('movingobject', ['observeOnScope', function(observeOnScope) {

    var moveToStartPos = function (car, movingElement) {
        var freeStartPos = $('[carstartpos=""]').first();

        freeStartPos.attr('carstartpos', car.name);

        var carMainRect = $('.carMainRect', movingElement);
        movingElement.carCenterX = Number(carMainRect.attr('x')) + (Number(carMainRect.attr('width')) / 2);
        movingElement.carCenterY = Number(carMainRect.attr('y')) + (Number(carMainRect.attr('height')) / 2);

        movingElement.attr('x', Number(freeStartPos.attr('cx')) - movingElement.carCenterX);
        movingElement.attr('y', Number(freeStartPos.attr('cy')) - movingElement.carCenterY);
    };

    return {
        link: function (scope, element) {

            moveToStartPos(scope.car, element);

            scope.car.direction = 0;
            scope.car.timestamp = 0;

            var revs = observeOnScope(scope, 'car.engine.currentPresumedSpeed')
                .filter(function (revs) { return revs.newValue > 0; })
                .take(1)
                .selectMany(function () {
                    return Rx.Observable.interval(model.MOVING_RATE).select(function () { return scope.car.engine.currentPresumedSpeed; })
                        .takeWhile(function () { return scope.car.engine.currentPresumedSpeed > 0; });
                })
                .repeat();

            var toRadians = function (angle) {
                return angle * (Math.PI / 180);
            };

            var subscriptionFn = function (timestampedValue) {
                var newAngle = scope.car.direction;

                if (timestampedValue.timestamp - scope.car.timestamp > model.STEERING_SAMPLING_RATE) {
                    newAngle += scope.car.steering.angle;

                    if (newAngle > 360) { newAngle = newAngle - 360; }
                    if (newAngle < -360) { newAngle = newAngle + 360; }

                    scope.car.direction = newAngle;
                    scope.car.timestamp = timestampedValue.timestamp;

                    scope.$apply();
                }

                var currX = Number(element.attr('x'));
                var currY = Number(element.attr('y'));

                var newY = (Math.sin(toRadians(newAngle)) * model.UNIT_OF_MOVEMENT) + currY;
                var newX = (Math.cos(toRadians(newAngle)) * model.UNIT_OF_MOVEMENT) + currX;

                element.attr('x', newX);
                element.attr('y', newY);

                scope.car.nextCheckpointCtrl.checkIfCheckpointCrossed(scope.car, currX, currY, newX, newY);

                var dist = Math.sqrt(Math.pow(Math.abs(newX - currX), 2) + Math.pow(Math.abs(newY - currY), 2));

                scope.car.actualSpeed = dist / model.MOVING_RATE;
            };

            revs.timestamp().subscribe(subscriptionFn);
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
                    '<div ng-repeat="checkpointtime in checkpointtimes2">' +
                        '<div>{{checkpointtime}}</div>' +
                    '</div>' +
                  '</div>',
        link: function (scope) {
            scope.lap = 1;
            scope.checkpointtimes = [];

            var myStream = checkpointService.lapPubSubject.filter(function (item) { return item.name === scope.carname || item.name === 'raceStart'});
            var finishLine = myStream.filter(function (item) { return item.id === 4; });

            finishLine.subscribe(function () {
                scope.lap = scope.lap + 1;
            });

            var aggregated = myStream.takeUntil(finishLine).aggregate(0, function(acc, data) {
                if (acc === 0) {
                    return data.time;
                } else if (data.id === 4) {
                    return data.time - acc;
                }
                else {
                    scope.checkpointtimes.push((data.time - acc) / 1000);
                    return acc;
                }
            }).repeat();

            aggregated.subscribe(function (elapsedTime) {
                scope.lastLapTime = elapsedTime / 1000;
                scope.checkpointtimes = [];
                scope.$apply();
            });

            var bestLapTime = aggregated.scan(0, function (acc, lapTime) {
                if (lapTime < acc || acc === 0) {
                    return lapTime;
                } else {
                    console.log('not better time:' + lapTime + ',vs. ' + acc);
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