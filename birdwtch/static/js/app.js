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
  "pseudort",
  "barchart",
  "stackedbar"
],
function ($, _, ko, viewmodel, websocket, worldmap, moment, pseudort, barchart,
stackedbar) {
  var exports = {}, makeDot, world, receive_tweets, deburst, metadata,
    updateStats, initStats, stats = {}, withCommas, updateRatio,
    previous_receipt_at = 0, intervalId = null, intervals = [],
    delay = 100, serverDelay = 4000, startTime = moment(),
    colormap = {}, languages,
    language_bar, language_chart, language_stats = {total: 0, lang: {}},
    country_chart, country_stats = {};

  exports.initialize = function () {
    console.log("Initializing app.");
    ko.applyBindings(viewmodel);

    languages = {
      en:  {code: 'en', name: 'English', color: "#00beff"},
      es:  {code: 'es', name: 'Español', color: "#CBFF00"},
      pt:  {code: 'pt', name: 'Português', color: "#27FF00"},
      it:  {code: 'it', name: 'Italiano', color: "#FF004B"},
      tr:  {code: 'tr', name: 'Türkçe', color: "#00FF63"},
      ru:  {code: 'ru', name: 'Pу́сский', color: "#00FFDC"},
      ar:  {code: 'ar', name: 'العربية', color: "#EC00FF"},
      fr:  {code: 'fr', name: 'Français', color: "#FF7A00"},
      ja:  {code: 'ja', name: '日本語', color: "#7c00ff"},
      de:  {code: 'de', name: 'Deutsch', color: "#1465ff"},
      id:  {code: 'id', name: 'Bahasa Indonesia', color: "#FFC500"},
      th:  {code: 'th', name: 'ภาษาไทย', color: "#077500"},
      und: {code: 'und', name: 'All others', color: "#181815"},
    };

    // Make a colormap object.
    _.each(languages, function (metadata, lang) {
      colormap[lang] = metadata.color;
    });

    // Initialize all language layers, including a layer for showing all of
    // them.
    viewmodel.languageLayers(
      [{code: 'all', name: "Show all"}].concat(_.values(languages)));

    // Initialize the language statistics.
    _.each(languages, function (metadata, code) {
      language_stats.lang[code] = 0;
    });

    $("#worldmap").height($(window).height());
    world = worldmap.create("#worldmap", colormap);
    websocket.initialize(appConfig.tweet_channel, receive_tweets);
    websocket.initialize(appConfig.metadata_channel, metadata);
    
    viewmodel.layerShown("all");
    viewmodel.layerShown.subscribe(world.show);

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

    setTimeout(function () {
      $(".js-sidebar").css("left", "-500px");
      setTimeout(function () {
        $(".js-sidebar").css("left", "");
      }, 400);
    }, 4000);

    // Create a bar chart for showing language frequencies.
    language_bar = stackedbar.create(".language-graph");
    language_chart = barchart.create(".graph .languages");
    // Create a bar chart for showing country frequencies.
    country_chart = barchart.create(".graph .countries", {
      width: 700,
      max: 30
    });
  };
    
  receive_tweets = function (tweets) {
    language_stats.total += tweets.length;

    tweets.forEach(function (tweet) {
      if (_.has(language_stats.lang, tweet.lang)) {
        language_stats.lang[tweet.lang] += 1;
      }
      else {
        language_stats.lang.und += 1;
      }
  
      if (_.has(country_stats, tweet.origin)) {
        country_stats[tweet.origin].total += 1;
        if (_.has(country_stats[tweet.origin].languages, tweet.lang)) {
          country_stats[tweet.origin].languages[tweet.lang] += 1;
        }
        else {
          country_stats[tweet.origin].languages[tweet.lang] = 1;
        }
      }
      else {
        country_stats[tweet.origin] = {
          total: 1,
          languages: {}
        };
        country_stats[tweet.origin].languages[tweet.lang] = 1;
      }

    });

    language_bar.draw(_.map(language_stats.lang, function (value, lang) {
      return {
        frequency: value,
        class: "dot-" + lang,
        name: languages[lang].name
      };
    }));

    language_chart.draw(_.map(language_stats.lang, function (value, lang) {
      return {
        frequency: value,
        class: "dot-" + lang,
        name: languages[lang].name
      };
    }));

    country_chart.draw(_.map(country_stats, function (data, country) {
      return {
        frequency: data.total,
        class: "land",
        name: country
      };
    }));

    // Show tweets, but not all at once, hence the de-bursting.
    deburst(tweets);
  };

  /**
   * Send tweets to be printed on the map at some interval
   */
  deburst = function (tweets) {
    var interval = 20, dots = tweets.map(makeDot), index = 1;
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
      if (dots.length && index < dots.length) {
        world.dots(dots.slice(0, index++));
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
      attr: tweet.lang,
      class: "dot-" + tweet.lang
    };
  };

  $(window).resize(function () {
    $("#worldmap").height($(window).height());
    world.redraw();
    language_bar.redraw();
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
