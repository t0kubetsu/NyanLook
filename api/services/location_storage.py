import json
from datetime import datetime
from typing import Optional


class LocationStorage:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.LOCATION_PREFIX = "device:location:"
        self.DEVICE_LIST_KEY = "devices:active"
        self.HISTORY_PREFIX = "device:history:"

    def store_latest_location(self, device_id: str, data: dict) -> bool:
        try:
            key = f"{self.LOCATION_PREFIX}{device_id}"
            self.redis.set(key, json.dumps(data))
            self.redis.expire(key, 3600)  # 1 hour

            self.redis.sadd(self.DEVICE_LIST_KEY, device_id)

            return True
        except Exception as e:
            print(f"Error storing location: {e}")
            return False

    def store_location_history(
        self, device_id: str, data: dict, max_history: int = 1440
    ) -> bool:
        try:
            key = f"{self.HISTORY_PREFIX}{device_id}"
            self.redis.zadd(key, {json.dumps(data): data["timestamp"]})
            total = self.redis.zcard(key)
            if total > max_history:
                self.redis.zremrangebyrank(key, 0, total - max_history - 1)
            self.redis.expire(key, 604800)  # 7 days
            return True
        except Exception as e:
            print(f"Error storing history: {e}")
            return False

    def get_latest_location(self, device_id: str) -> Optional[dict]:
        try:
            data = self.redis.get(f"{self.LOCATION_PREFIX}{device_id}")
            return json.loads(data) if data else None
        except Exception as e:
            print(f"Error getting location: {e}")
            return None

    def get_location_history(self, device_id: str, limit: int = 100) -> list:
        try:
            data = self.redis.zrevrange(
                f"{self.HISTORY_PREFIX}{device_id}", 0, limit - 1
            )
            return [json.loads(item) for item in data]
        except Exception as e:
            print(f"Error getting history: {e}")
            return []

    def get_all_active_devices(self) -> list:
        try:
            return list(self.redis.smembers(self.DEVICE_LIST_KEY))
        except Exception as e:
            print(f"Error getting devices: {e}")
            return []

    def get_device_stats(self, device_id: str) -> dict:
        try:
            history_key = f"{self.HISTORY_PREFIX}{device_id}"
            total_records = self.redis.zcard(history_key)
            latest = self.get_latest_location(device_id)

            return {
                "device_id": device_id,
                "total_records": total_records,
                "latest_location": latest,
                "last_seen": datetime.fromtimestamp(
                    latest["timestamp"] / 1000
                ).isoformat()
                if latest
                else None,
            }
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {}
