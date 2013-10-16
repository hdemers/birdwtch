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
  var exports = {}, dot, points = [], world, deburst, metadata,
    updateStats, initStats, stats = {}, withCommas, updateRatio,
    previous_receipt_at = 0, tweet_cache = [], intervalId = null,
    delay = 100, serverDelay = 4000, startTime = moment();

  exports.initialize = function () {
    console.log("Initializing app.");
    ko.applyBindings(viewmodel);

    $("#worldmap").height($(window).height());
    world = worldmap.create("#worldmap");
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
    var interval = 30;
    
    // Empty cache if too big.
    if (tweet_cache.length > 2 * tweets.length) {
      tweet_cache = [];
    }
    tweet_cache = tweet_cache.concat(tweets);

    // Estimate how much time we have to paint each dot on the map. This
    // estimate is based on the last interval and is thus imprecise. That's
    // why we have to empty the cache periodically.
    if (previous_receipt_at) {
      interval = (moment() - previous_receipt_at) / (tweet_cache.length * 1.2);
    }
    previous_receipt_at = moment();
    if (intervalId) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(function () {
      if (tweet_cache.length) {
        dot(tweet_cache.shift());
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
    console.log(data);
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
   * Add a dot on the worldmap.
   */
  dot = function (tweet) {
    var point = {
      lng: tweet.coordinates.coordinates[0],
      lat: tweet.coordinates.coordinates[1],
      r: 1
    };
    points.push(point);
    world.dot(points);
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
