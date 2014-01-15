/*global */
define([
  "jquery",
  "underscore",
  "d3"
],
function ($, _, d3) {
  var exports = {};
  
  exports.create = function (selector) {
    var that = {},
      margin = {top: 10, right: 10, bottom: 120, left: 40},
      width = 300 - margin.left - margin.right,
      height = 550 - margin.top - margin.bottom,
      xAxis, yAxis, formatPercent,
      x = d3.scale.ordinal().rangeRoundBands([0, width], 0.85, 1.5),
      y = d3.scale.linear().range([height, 0]),
      svg;
    
    formatPercent = d3.format(".0%");

    svg = d3.select(selector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "bar-lang")
        .on("mouseover", function () {
          d3.selectAll(".axis").classed({hide: false});
        })
        .on("mouseout", function () {
          d3.selectAll(".axis").classed({hide: true});
        })
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(formatPercent);

    svg.append("g")
        .attr("class", "x axis hide")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-90)");

    svg.append("g")
      .attr("class", "y axis hide")
      .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Proportion");

    that.draw = function (data) {
      var bars;

      x = x.domain(
          data.sort(function (a, b) { return b.frequency - a.frequency; })
            .map(function (d) { return d.name; }));

      //x.domain(data.map(function (d) { return d.name; }));
      y.domain([0, d3.max(data, function (d) { return d.frequency; })]);

      bars = svg.selectAll(".bar")
        .data(data, function (d) {return d.name; });
      
      bars.enter().append("rect")
        .attr("class", function (d) {return "bar " + d.class; })
        .attr("x", function (d) { return x(d.name); })
        .attr("y", function (d) { return y(d.frequency); })
        .attr("width", x.rangeBand())
        .attr("height", function (d) { return height - y(d.frequency); });
      
      bars.transition()
        .duration(700)
        .attr("x", function (d) { return x(d.name); })
        .attr("y", function (d) { return y(d.frequency); })
        .attr("width", x.rangeBand())
        .attr("height", function (d) { return height - y(d.frequency); });

      svg.select(".x.axis")
        .call(xAxis)
        .selectAll("text")
          .attr("dx", "-.8em")
          .attr("dy", "-.5em")
          .attr("transform", "rotate(-90)")
          .style("text-anchor", "end");
    };

    return that;
  };

  return exports;
});
