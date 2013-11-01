/* Author: Hugues Demers
 * Copyrights 2013
 *
 * Draw a world map and provide a method `dot` to add small circle on the map.
 *
 * Function `create` returns a worldmap object with a method `dot` for adding
 * circles.
 */

/*global topojson:false */
define([
  "jquery",
  "topo",
  "d3",
  "projection"
],
function ($, topo, d3) {
  var exports = {}, scaleFactor;

  // Draw the world.
  exports.create = function (container, colorMap) {
    var that = {},
      height, width, ratio,
      path, projection, svg, g,
      canvas, context,
      deferred, canvasDot,
      colormap = colorMap;

    that.draw = function () {
      deferred = $.Deferred();
      that.promise = deferred.promise();

      width = $(container).width();
      height = $(container).height();
      ratio = width / height;

      // Use a quantized scale function of the screen ratio
      projection = d3.geo.ginzburg5()
        .scale(width * scaleFactor(ratio))
        .center([0, 0])
        .rotate([0, 0])
        .translate([width / 2.1, height / 1.8]);

      path = d3.geo.path()
        .projection(projection);

      svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height);

      canvas = d3.select(container).append("canvas")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "foreground");

      context = document.getElementById("foreground").getContext("2d");
      context.globalAlpha = 0.6;

      g = svg.append("g");

        // Load country data and draw.
      d3.json("/static/js/other/world-50m.json",
      function (error, world) {
        g.insert("path")
          .datum(topojson.feature(world, world.objects.land))
          .attr("class", "land")
          .attr("d", path);

        g.insert("path")
          .datum(
            topojson.mesh(world, world.objects.countries, function (a, b) {
              return a !== b;
            }))
              .attr("class", "boundary")
              .attr("d", path);
        deferred.resolve();
      });

      svg.call(d3.behavior.zoom()
        .on("zoom", function () {
          g.attr("transform", "translate(" +
            d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");
          g.selectAll("path")
            .attr("d", path.projection(projection));
        }));
    };

    // Draw dots on the world. Wait for the world to be drawn first.
    that.dots = function (data) {
      deferred.done(function () {
        // D3.js transitions are too costly for phones and tablets.
        if (navigator.userAgent.match("Android") ||
            navigator.userAgent.match("iPhone") ||
            navigator.userAgent.match("iPad")) {
          canvasDot(data[data.length - 1]);
        }
        else {
          g.selectAll("circle")
            .data(data)
            .enter()
              .append("circle")
              .call(function (dots) {
                dots.data().map(canvasDot);
              })
              .attr("cx", function (d) {
                return projection(d.coordinates)[0];
              })
              .attr("cy", function (d) {
                return projection(d.coordinates)[1];
              })
              .attr("r", function (d) {return d.r; })
              .attr("class", function (d) {return "dot " + d.class; })
            .transition()
              .duration(100)
              .attr("r", function (d) {return d.r * 10; })
            .transition()
              .duration(200)
              .attr("r", function (d) {return d.r; });
        }
      });
    };

    that.clear = function () {
      g.selectAll("circle").remove();
    };

    canvasDot = function (datum) {
      var projected = projection(datum.coordinates);
      context.beginPath();
      context.arc(projected[0], projected[1], datum.r, 0, 2 * Math.PI);
      context.fillStyle = colormap[datum.lang] || colormap.und;
      context.fill();
    };

    // Redraw the map
    that.redraw = function () {
      if ($(container).width() !== width) {
        // Remove everything under `container`.
        $(container).children().remove();
        that.draw();
      }
    };

    that.draw();
    return that;
  };

  scaleFactor = function (ratio) {
    console.log("Screen ratio", ratio);
    if (ratio > 1.9) {
      return 0.195;
    }
    else if (ratio > 1.5) {
      return 0.23;
    }
    else if (ratio > 1) {
      return 0.25;
    }
  };

  return exports;
});

