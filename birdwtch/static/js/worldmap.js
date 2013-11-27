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
  "underscore",
  "topo",
  "d3",
  "projection"
],
function ($, _, topo, d3) {
  var exports = {}, scaleFactor, doAnimation, createCanvas, addToContext;

  // Draw the world.
  exports.create = function (container, colorMap) {
    var that = {},
      height, width, ratio,
      path, projection, dots_g, world_g,
      allContext, attrContexts = {},
      deferred, canvasDot,
      colormap = colorMap;

    that.draw = function () {
      deferred = $.Deferred();
      that.promise = deferred.promise();

      width = $(container).width();
      height = $(container).height();
      if (width < height) {
        ratio = height / width;
      }
      else {
        ratio = width / height;
      }

      // Use a quantized scale function of the screen ratio
      projection = d3.geo.ginzburg5()
        .scale(width * scaleFactor(ratio))
        .center([0, 0])
        .rotate([0, 0])
        .translate([width / 2.1, height / 1.8]);

      path = d3.geo.path()
        .projection(projection);

      world_g = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

      _.each(colormap, function (color, attr) {
        attrContexts[attr] = createCanvas(color, attr);
      });
      allContext = createCanvas("", "all");
      allContext.globalAlpha = 0.6;
      that.show("all");
      
      dots_g = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "dotSvg")
        .append("g");

      // Load country data and draw.
      d3.json("/static/js/other/world-50m.json",
      function (error, world) {
        world_g.insert("path")
          .datum(topojson.feature(world, world.objects.land))
          .attr("class", "land")
          .attr("d", path);

        world_g.insert("path")
          .datum(
            topojson.mesh(world, world.objects.countries, function (a, b) {
              return a !== b;
            }))
              .attr("class", "boundary")
              .attr("d", path);
        deferred.resolve();
      });

    };

    // Draw dots on the world. Wait for the world to be drawn first.
    that.dots = function (data) {
      deferred.done(function () {
        // D3.js transitions are too costly for phones and tablets.
        if (!doAnimation()) {
          canvasDot(data[data.length - 1]);
        }
        else {
          dots_g.selectAll("circle")
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
      dots_g.selectAll("circle").remove();
    };

    canvasDot = function (datum) {
      addToContext(datum, allContext);
      addToContext(datum, attrContexts[datum.attr] || attrContexts.und);
    };

    addToContext = function (datum, context) {
      var projected = projection(datum.coordinates);
      context.beginPath();
      context.arc(projected[0], projected[1], datum.r, 0, 2 * Math.PI);
      if (context.name === "all") {
        context.fillStyle = colormap[datum.attr] || colormap.und;
      }
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

    createCanvas = function (color, name) {
      var context, canvasId = name + "Canvas";
      d3.select(container).append("canvas")
        .attr("width", width)
        .attr("height", height)
        .attr("id", canvasId);

      context = document.getElementById(canvasId).getContext("2d");
      context.fillStyle = color;
      context.name = name;
      return context;
    };
    
    that.show = function (layer) {
      // Hide all canvas
      $("canvas").hide();
      // Hide the dot svg
      $("#dotSvg").hide();

      if (layer === "all") {
        $("#dotSvg").show();
      }
      $("#" + layer + "Canvas").show();
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


  doAnimation = function () {
    return !(navigator.userAgent.match("Android") ||
      navigator.userAgent.match("iPhone") ||
      navigator.userAgent.match("iPad"));
  };

  return exports;
});

