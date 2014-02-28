/* Author: Hugues Demers
 * Copyrights 2013
 */
define(["knockout"],
function (ko) {
  var exports = {
    alertMsg: ko.observable(''),
    alertHeading: ko.observable(''),
    streamCount: ko.observable(0),
    streamRate: ko.observable(0),
    firehoseCount: ko.observable(0),
    firehoseRate: ko.observable(0),
    detectionCount: ko.observable(0),
    detectionRate: ko.observable(0),
    ratioDetStream: ko.observable(100),
    ratioDetFirehose: ko.observable(100),
    ratioStreamFirehose: ko.observable(100),
    runningTime: ko.observable("0s"),
    languageLayers: ko.observableArray(),
    layerShown: ko.observableArray()
  };
  return exports;
});
