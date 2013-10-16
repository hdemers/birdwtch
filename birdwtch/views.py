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
        'channel': config.pubsub_channel,
    }
    return render_template('index.html', config=webapp_config)


@sockets.route('/tweets')
def tweets(websocket):
    log.debug("Registering new websocket client.")
    publish.subscribe(websocket)
    publish.start()

    while websocket.socket is not None:
        # Context switch while `publish.start` is running in the
        # background.
        gevent.sleep()

    log.debug("Connection closed.")


def in_production():
    return os.environ.get("IS_PRODUCTION", "").lower() in ['true', 'yes']
