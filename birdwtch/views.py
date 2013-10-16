"""
URL routes declarations.

All views are currently declared here.

"""
import os

from flask import render_template
import gevent

from birdwtch import app, make_json_error, config, publish, sockets
from cloudly import logger

log = logger.init(__name__)


@app.errorhandler(Exception)
def error_handler(error):
    return make_json_error(error)


@app.route('/')
def index():
    """A map with real-time tweets shown.
    Configuration options are set here and available to the client via the
    global variable `appConfig`, see templates/base.html.
    """
    webapp_config = {
        'tweet_channel': config.tweet_channel,
        'metadata_channel': config.metadata_channel,
    }
    return render_template('index.html', config=webapp_config)


@sockets.route('/tweets')
def tweets(websocket):
    channel = config.tweet_channel
    log.debug("Registering new websocket client for channel '{}'".format(
        channel))
    publish.subscribe(websocket, channel)
    publish.start()

    while websocket.socket is not None:
        # Context switch while `publish.start` is running in the
        # background.
        gevent.sleep()

    log.debug("Connection closed.")


@sockets.route('/metadata')
def metadata(websocket):
    channel = config.metadata_channel
    log.debug("Registering new websocket client for channel '{}'".format(
        channel))
    publish.subscribe(websocket, channel)
    publish.start()

    while websocket.socket is not None:
        # Context switch while `publish.start` is running in the
        # background.
        gevent.sleep()

    log.debug("Connection closed.")


def in_production():
    return os.environ.get("IS_PRODUCTION", "").lower() in ['true', 'yes']
