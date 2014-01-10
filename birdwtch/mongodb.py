import os

from pymongo import MongoClient

from cloudly.decorators import Memoized


@Memoized
def get_db(database_name):
    mongohq_url = os.environ['MONGOHQ_URL']
    return MongoClient(mongohq_url + '/' + database_name)[database_name]
