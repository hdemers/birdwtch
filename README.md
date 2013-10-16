birdwtch
========

Real-time geo-located tweets on a map.


I use:

 - [jQuery](http://jquery.com/)
 - [Flask](http://flask.pocoo.org/)
 - [WebSockets](http://www.html5rocks.com/en/tutorials/websockets/basics/)
 - [RequireJS](http://requirejs.org/)
 - [Underscore.js](https://github.com/amdjs/underscore)
 - [Knockout.js](http://knockoutjs.com/)
 - [Bootstrap](http://twitter.github.io/bootstrap/)
 - [d3.js](http://d3js.org/)


The file layout is inspired from this
[discussion](http://flask.pocoo.org/docs/patterns/packages/).


What it does
------------

Stream all tweets having coordinates by using the `locations`
(https://dev.twitter.com/docs/streaming-apis/parameters#locations) parameter of
the Stream API. With a `locations` value of *-180, -90, 180, 90*, all geotagged
tweets are returned.

Show those tweets on a map.


Licence
-------

MIT
