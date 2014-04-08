from os import path
import json

from shapely.geometry import asShape

from cloudly.decorators import Memoized
from birdwtch import mongodb


@Memoized
def load_countries():
    dirname = path.dirname(__file__)
    filename = path.join(dirname, "..", "data", "countries-hires.json")

    with open(filename) as f:
        countries = json.load(f)
    return countries['features']


def get_all_from(country):
    members = []
    if country['geometry']['type'] == "MultiPolygon":
        for polygon in country['geometry']['coordinates']:
            geometry = {
                'coordinates': polygon,
                'type': "Polygon"
            }
            members.extend(list(_query_geometry(geometry)))
    else:
        members.extend(list(_query_geometry(country['geometry'])))
    return members


def _query_geometry(geometry):
    db = mongodb.get_db("sandbox")
    return db.geotweets.find({'coordinates': {
        '$geoWithin': {
            '$geometry': geometry
        }
    }})


@Memoized
def get_countries_polygons():
    countries = load_countries()
    return [(c, asShape(c['geometry'])) for c in countries]


def originating_country(tweet):
    for country, polygon in get_countries_polygons():
        if asShape(tweet['coordinates']).within(polygon):
            return country


def country(tweets):
    for tweet in tweets:
        country = 'Unknown'
        country_code = 'UNK'

        if 'place' in tweet and tweet['place']:
            if 'country' in tweet['place']:
                country = tweet['place']['country']
                country_code = tweet['place']['country_code']

        tweet['origin'] = country
        tweet['origin_code'] = country_code
