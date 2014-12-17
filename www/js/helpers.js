/**
 * Created by karkkmik on 17.12.2014.
 */
var toRadians = function (angle) {
    return angle * (Math.PI / 180);
};

var getNormalizedCarPos = function (currX, currY) {
  return  {
    X: currX + 20,
    Y: currY + 30
  };
};