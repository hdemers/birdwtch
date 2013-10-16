/*global  */
define([
  "underscore"
],
function (_) {
  var exports = {};


  exports.create = function (updateInterval, setInterval, startValue) {
    var that,
      target = 0,
      increment = 0,
      period = setInterval / updateInterval,
      current = startValue || 0;

    that = function () {
      if (current < target) {
        current = current + increment;
        current = current > target ? target : current;
      }
      return Math.round(current);
    };

    that.set = function (newTarget) {
      target = newTarget;
      increment = (target - current) / period;
    };

    that.add = function (targetUpdate) {
      target += targetUpdate;
      that.set(target);
    };

    return that;
  };

  return exports;
});


