/**
 * Created by karkkmik on 5.11.2014.
 */
describe('directive: movingobject', function () {
    var element, scope;

    console.log('create app');

    beforeEach(module('app'));

    console.log('hei');
    console.log(app);

    beforeEach(inject(function($compile, $rootScope) {
        scope = $rootScope;

        element = $(
            '<svg movingobject>' +
                '<line id="leftFront" transform="rotate ( {{angle}} {{leftTyreCenterX}} {{leftTyreCenterY}} )"></line>' +
            '</svg>');

        var engine = new model.Engine('foo', 10000, 1);

        scope.car = new model.Car('testCar', {}, engine, 200, 1);

        scope.leftTyreCenterX = 100;
        scope.leftTyreCenterY = 100;
        scope.angle = 0;

        element = $compile(element)(scope);
        scope.$apply();
    }));

    describe('when steering wheel not turned', function () {
        it('wheels should be straight', function () {
            var isolated = element.scope();
            expect(isolated.angle).toBe(0);
        });
    });

});
