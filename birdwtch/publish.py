import gevent

from cloudly.pubsub import RedisWebSocket
from cloudly.tweets import Tweets, StreamManager, keep
from cloudly import logger, cache

from birdwtch.config import tweet_channel, metadata_channel

log = logger.init(__name__)
channels = {
    tweet_channel: RedisWebSocket(tweet_channel),
    metadata_channel: RedisWebSocket(metadata_channel),
}
for pubsub in channels.itervalues():
    pubsub.spawn()
redis = cache.get_redis_connection()


def process_tweets(tweets):
    channels[tweet_channel].publish(keep(['coordinates', 'lang'], tweets),
                                    "tweets")
    return len(tweets)


def process_metadata(metadata):
    channels[metadata_channel].publish(metadata)


def run():
    log.info("Starting Twitter stream manager.")
    streamer = StreamManager('locate', process_tweets, process_metadata,
                             is_queuing=False)
    tweets = Tweets()
    streamer.run(tweets.with_coordinates(), stop)
    log.info("Twitter stream manager has stopped.")


def start():
    log.debug("State of stream manager: {}".format(redis.get("stream")))
    if redis.getset("stream", "running") in ["stopped", None]:
        gevent.spawn(run)


def subscribe(websocket, channel):
    log.info("Subscribed a new websocket client to '{}'".format(channel))
    channels[channel].register(websocket)


def stop():
    if len(channels['tweets'].websockets) == 0:
        log.info("Stopping Twitter stream manager.")
        redis.set("stream", "stopped")
        return True
    return False
