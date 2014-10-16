'use strict'

app.directive('canvas', function () {
    return {
        templateNamespace: 'svg',
        template: '<svg ng-click="add()" height="400" style="display: inline-block" width="60%" ng-transclude></svg>',
        restrict: 'E',
        replace: true,
        transclude: true
    };
});

app.directive('powermeter', function () {
    return {
        template: '<div style="height: {{(device.engine.revs/device.engine.maxRevs)*100}}px;background-color: red"></div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('speedometer', function () {
    return {
        template: '<div>speed:{{device.engine.currentPresumedSpeed}}, actual:{{device.actualSpeed}}</div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('gearbox', function () {
    return {
        template: '<div>gear:{{device.engine.gear}}</div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('steering', function () {
    return {
        template: '<div>angle:{{device.steering.angle}}></div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('device', function () {
    return {
        templateNamespace: 'svg',
        //template: '<circle cx="200" cy="200" r=10 data-name="{{device.name}}" style="background-color: #105cb6"></circle>',
        templateUrl: './html/carTemplate.html',
        restrict: 'E',
        replace: true,
        transclude: true,
        link: function (scope) {

            var device = scope.device;
            device.accelerationTimestamp = 0;

            var keyup = Rx.Observable.fromEvent(document, 'keyup');
            var keydown = Rx.Observable.fromEvent(document, 'keydown');

            var gasKeyFilter = function (kbevent) {
                return kbevent.key === device.gas;
            };
            var steerLeftFilter = function (kbevent) {
                return kbevent.key === device.left;
            };
            var steerRightFilter = function (kbevent) {
                return kbevent.key === device.right;
            };

            keydown.filter(gasKeyFilter)
                .takeWhile(function () { return scope.device.engine.currentPresumedSpeed < scope.device.engine.maxSpeed; })
                .selectMany(function () {
                    return Rx.Observable.interval(0, 15)
                        .takeUntil(keyup.filter(gasKeyFilter))
                        .takeWhile(function () { return scope.device.engine.currentPresumedSpeed < scope.device.engine.maxSpeed; });
                })
                .repeat()
                .subscribe(function () {
                    device.accelerate();
                    scope.$apply();
                });

            var turnLeft = keydown.filter(steerLeftFilter).select(function (kb) {
                return kb.keyCode;
            })
                .take(1)
                .takeWhile(function () { return device.steering.angle > -(device.steering.maxAngle); })
                .selectMany(function (keyCode) {
                    return Rx.Observable.interval(0, model.STEERING_SAMPLING_RATE)
                        .select(function () { return keyCode; })
                        .takeUntil(keyup.filter(steerLeftFilter))
                        .takeWhile(function () { return device.steering.angle > -(device.steering.maxAngle); });
                })
                .repeat();

            turnLeft.subscribe(function () {
                device.steering.turnLeft();
                scope.$apply();
            });

            var turnRight = keydown.filter(steerRightFilter).select(function (kb) {
                return kb.keyCode;
            })
                .take(1)
                .takeWhile(function () { return device.steering.angle < device.steering.maxAngle; })
                .selectMany(function (keyCode) {
                    return Rx.Observable.interval(0, model.STEERING_SAMPLING_RATE)
                        .select(function () { return keyCode; })
                        .takeUntil(keyup.filter(steerRightFilter))
                        .takeWhile(function () { return device.steering.angle < device.steering.maxAngle; });
                })
                .repeat();

            turnRight.subscribe(function () {
                device.steering.turnRight();
                scope.$apply();
            });

            var centerSteeringSubscription = function () {
                device.steering.center();
                scope.$apply();
            };

            keyup.filter(steerLeftFilter).subscribe(centerSteeringSubscription);
            keyup.filter(steerRightFilter).subscribe(centerSteeringSubscription);

            keyup.filter(gasKeyFilter).subscribe(function () {
                device.break();
                scope.$apply();
            });
        }
    };
});

app.directive('movingobject', ['observeOnScope', function(observeOnScope) {
    return {
        link: function (scope, element) {

            scope.device.direction = 0;
            scope.device.timestamp = 0;

            var revs = observeOnScope(scope, 'device.engine.currentPresumedSpeed')
                .filter(function (revs) { return revs.newValue > 0; })
                .take(1)
                .selectMany(function () {
                    return Rx.Observable.interval(model.MOVING_RATE).select(function () { return scope.device.engine.currentPresumedSpeed; } )
                        .takeWhile(function () { return scope.device.engine.currentPresumedSpeed > 0; });
                })
                .repeat();

            var toRadians = function (angle) {
                return angle * (Math.PI / 180);
            };

            var subscriptionFn = function (timestampedValue) {
                var newAngle = scope.device.direction;

                if (timestampedValue.timestamp - scope.device.timestamp > model.STEERING_SAMPLING_RATE) {
                    newAngle += scope.device.steering.angle;

                    if (newAngle > 360) { newAngle = newAngle - 360; }

                    scope.device.direction = newAngle;

                    scope.device.timestamp = timestampedValue.timestamp;
                }

                var currX = Number(element.attr('x'));
                var currY = Number(element.attr('y'));

                var newY = (Math.sin(toRadians(newAngle)) * 2) + currY;
                var newX = (Math.cos(toRadians(newAngle)) * 2) + currX;

                element.attr('x', newX);
                element.attr('y', newY);

                var dist = Math.sqrt(Math.pow(Math.abs(newX - currX), 2) + Math.pow(Math.abs(newY - currY), 2));

                scope.device.actualSpeed = dist / model.MOVING_RATE;
                //console.log(currX + ',' + currY + ',' + x + ',' + y + ',' + dist);
            };

            revs.timestamp().subscribe(subscriptionFn);
        }
    };
}]);