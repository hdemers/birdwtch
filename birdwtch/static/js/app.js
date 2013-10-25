/* Author: Hugues Demers
 * Copyrights 2013
  
*/
/*global appConfig:false */
define([
  "jquery",
  "underscore",
  "knockout",
  "viewmodel",
  "websocket",
  "worldmap",
  "moment",
  "pseudort"
],
function ($, _, ko, viewmodel, websocket, worldmap, moment, pseudort) {
  var exports = {}, makeDot, world, deburst, metadata,
    updateStats, initStats, stats = {}, withCommas, updateRatio,
    previous_receipt_at = 0, intervalId = null, intervals = [],
    delay = 100, serverDelay = 4000, startTime = moment(), colormap;

  exports.initialize = function () {
    console.log("Initializing app.");
    ko.applyBindings(viewmodel);

    colormap = {
      en: "#00beff",
      it: "#FF004B",
      es: "#CBFF00",
      pt: "#27FF00",
      tr: "#00FF63",
      ru: "#00FFDC",
      ar: "#EC00FF",
      fr: "#FF7A00",
      ja: "#7c00ff",
      de: "#1465ff",
      id: "#FFC500",
      und: "#181815",
    };

    $("#worldmap").height($(window).height());
    world = worldmap.create("#worldmap", colormap);
    websocket.initialize(appConfig.tweet_channel, deburst);
    websocket.initialize(appConfig.metadata_channel, metadata);

    // Start the time counter.
    setInterval(function () {
      var now = moment(),
        secs = now.diff(startTime, 'seconds'),
        mins = now.diff(startTime, 'minutes'),
        hours = now.diff(startTime, 'hours'),
        str = (hours > 0 ? hours + "h " : " ") +
              (mins > 0 ? mins % 60 + "m " : " ") +
              (secs > 0 ? secs % 60 + "s " : " ");

      viewmodel.runningTime(str);
    }, 1000);

  };

  /**
   * Send tweets to be printed on the map at some interval
   */
  deburst = function (tweets) {
    var interval = 20, dots = tweets.map(makeDot), drawn = [];
    world.clear();
    
    // Estimate how much time we have to paint each dot on the map. This
    // estimate is based on the last interval and is thus imprecise. That's
    // why we have to empty the cache periodically.
    if (previous_receipt_at) {
      intervals.push((moment() - previous_receipt_at) / (dots.length * 1.2));
      if (intervals.length > 5) {
        intervals.shift();
      }
      interval = _.reduce(intervals, function (memo, num) {
        return memo + num;
      }, 0) / intervals.length;
    }
    previous_receipt_at = moment();
    if (intervalId) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(function () {
      if (dots.length) {
        drawn = drawn.concat(dots.shift());
        world.dots(drawn);
      }
    }, interval);
  };

  initStats = _.once(function (metadata) {
    stats = {
      baseCounts: _.clone(metadata.counts),
      counts: {}
    };
    _.each(metadata.counts, function (count, key) {
        stats.counts[key] = pseudort.create(delay, serverDelay);
      });
    // Start an interval timer to update our stats.
    setInterval(updateStats, delay);
  });


  /**
   * Show metadata information.
   */
  metadata = function (data) {
    // Execute once.
    initStats(data);

    // Shift all counts by their base value and set the new target.
    _.each(data.counts, function (value, key) {
      stats.counts[key].set(value - stats.baseCounts[key]);
    });

  };

  updateStats = function () {
    var detection = stats.counts.detection(),
      stream = stats.counts.stream(),
      firehose = stats.counts.firehose(),
      now = moment(),
      delta_seconds = now.diff(startTime, "seconds");

    viewmodel.detectionCount(withCommas(detection));
    viewmodel.streamCount(withCommas(stream));
    viewmodel.firehoseCount(withCommas(firehose));

    viewmodel.firehoseRate(
      withCommas(Math.round(60 * firehose / delta_seconds)));
    viewmodel.streamRate(
      withCommas(Math.round(60 * stream / delta_seconds)));
    viewmodel.detectionRate(
      withCommas(Math.round(60 * detection / delta_seconds)));
    
    //updateRatio(viewmodel.ratioDetFirehose, detection, firehose);
    //updateRatio(viewmodel.ratioStreamFirehose, stream, firehose);
    //updateRatio(viewmodel.ratioDetStream, detection, stream);
  };

  updateRatio = function (ratio, numerator, denominator) {
    if (denominator !== 0) {
      ratio(numerator / denominator);
    }
  };

  /**
   * Make a dot from a tweet.
   */
  makeDot = function (tweet) {
    return {
      coordinates: tweet.coordinates.coordinates,
      r: 1.5,
      lang: tweet.lang,
      class: "lang-" + tweet.lang
    };
  };

  $(window).resize(function () {
    $("#worldmap").height($(window).height());
    world.redraw();
  });

  /**
   * Return a string representing a number with commas as thousands separator.
   * Taken from http://stackoverflow.com/a/2901298
   */
  withCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return exports;
});
