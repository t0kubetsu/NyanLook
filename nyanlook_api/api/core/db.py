import os

import redis


def get_kvstore():
    return redis.Redis(
        host=os.getenv("KVROCKS_HOST", "localhost"),
        port=int(os.getenv("KVROCKS_PORT", 6666)),
        decode_responses=True,
        db=0,
    )
