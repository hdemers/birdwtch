/*global */
define([
  "jquery",
  "underscore",
  "d3"
],
function ($, _, d3) {
  var exports = {}, y_text;
  
  var sum = function (array) {
    return _.reduce(array, function (memo, num) { return memo + num; }, 0);
  };

  exports.create = function (selector) {
    var that = {}, margin, width, height, y, svg, barWidth;

    that.init = function () {
      barWidth = 6;
      margin = {top: 0, right: 0, bottom: 0, left: 0};
      width = barWidth + margin.left + margin.right;
      height = $(selector).height() - margin.top - margin.bottom;
      y = d3.scale.linear().rangeRound([height, 0]);

      svg = d3.select(selector).append("svg")
          .attr("width", width)
          .attr("height", height + margin.top + margin.bottom)
          .attr("class", "bar-lang")
        .append("g");
    };

    that.draw = function (data) {
      var bars, texts, total = sum(_.pluck(data, 'frequency')), y0 = 0;
      
      data.sort(function (a, b) { return b.frequency - a.frequency; });

      y.domain([0, total]);

      data.forEach(function (d) {
        d.y0 = y0;
        d.y1 = y0 + d.frequency;
        y0 = d.y1;
      });

      bars = svg.selectAll(".bar")
        .data(data, function (d) {return d.name; });
      
      bars.enter()
        .append("rect")
          .attr("class", function (d) {return "bar " + d.class; })
          .attr("x", 0)
          .attr("y", function (d) { return y(d.y1); })
          .attr("width", barWidth)
          .attr("height", function (d) { return y(d.y0) - y(d.y1); });

      //texts = svg.selectAll("text")
        //.data(data, function (d) {return d.name; });

      //texts.enter()
        //.append("text")
          //.attr("dy", "1em")
          //.attr("x", 30)
          //.attr("y", y_text)
          //.text(function (d) { return d.name; });
      
      bars.transition()
        .duration(700)
        .attr("y", function (d) { return y(d.y1); })
        .attr("height", function (d) { return y(d.y0) - y(d.y1); });

      //texts.transition()
        //.duration(700)
        //.attr("y", y_text);
    };

    that.redraw = function () {
      if ($(selector).height() !== height) {
        // Remove everything under `selector`.
        $(selector).children().remove();
        that.init();
      }
    };

    //y_text = function (d, i) {
      ////var height = y(d.y0) - y(d.y1);
      //return y(d.y1);
    //};

    that.init();
    return that;
  };

  return exports;
});

