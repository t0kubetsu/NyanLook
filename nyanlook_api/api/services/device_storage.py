from datetime import datetime
from typing import Optional

from api.models.device import DeviceData


class DeviceStorage:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.DEVICE_INFO_PREFIX = "device:info:"
        self.DEVICE_REGISTRY_KEY = "devices:registered"
        self.DEVICE_PLATFORM_PREFIX = "devices:platform:"
        self.DEVICE_LAST_SEEN_PREFIX = "device:last_seen:"
        self.DEVICE_ACTIVE_PREFIX = "device:active:"

    def store_device_info(self, device_id: str, device_data: DeviceData) -> bool:
        try:
            self.redis.set(f"{self.DEVICE_INFO_PREFIX}{device_id}", device_data.json())

            self.redis.sadd(self.DEVICE_REGISTRY_KEY, device_id)

            platform_key = (
                f"{self.DEVICE_PLATFORM_PREFIX}{device_data.platform.lower()}"
            )
            self.redis.sadd(platform_key, device_id)

            last_seen_key = f"{self.DEVICE_LAST_SEEN_PREFIX}{device_id}"
            self.redis.set(last_seen_key, int(datetime.now().timestamp() * 1000))

            return True
        except Exception as e:
            print(f"Error storing device info: {e}")
            return False

    def get_all_registered_devices(self) -> list:
        try:
            return list(self.redis.smembers(self.DEVICE_REGISTRY_KEY))
        except Exception as e:
            print(f"Error getting registered devices: {e}")
            return []

    def get_all_active_devices(self) -> list:
        try:
            keys = self.redis.keys(f"{self.DEVICE_ACTIVE_PREFIX}*")
            return [
                k.decode("utf-8").replace(self.DEVICE_ACTIVE_PREFIX, "") for k in keys
            ]
        except Exception as e:
            print(f"Error getting active devices: {e}")
            return []

    def is_device_active(self, device_id: str) -> bool:
        return self.redis.exists(f"{self.DEVICE_ACTIVE_PREFIX}{device_id}") == 1

    def get_device_info(self, device_id: str) -> Optional[DeviceData]:
        try:
            key = f"{self.DEVICE_INFO_PREFIX}{device_id}"
            data = self.redis.get(key)
            if data:
                return DeviceData.parse_raw(data)
            return None
        except Exception as e:
            print(f"Error getting device info: {e}")
            return None

    def get_device_last_seen(self, device_id: str) -> Optional[datetime]:
        try:
            last_seen_key = f"{self.DEVICE_LAST_SEEN_PREFIX}{device_id}"
            timestamp = self.redis.get(last_seen_key)
            if timestamp:
                return datetime.fromtimestamp(int(timestamp) / 1000)
            return None
        except Exception as e:
            print(f"Error getting last seen: {e}")
            return None

    def get_device_summary(self, device_id: str) -> Optional[dict]:
        try:
            device = self.get_device_info(device_id)
            if not device:
                return {}

            last_seen = self.get_device_last_seen(device_id)

            return {
                "device_id": device_id,
                "display_name": device.get_display_name(),
                "summary": device.to_summary(),
                "last_seen": last_seen.isoformat() if last_seen else None,
                "active": self.is_device_active(device_id),
            }
        except Exception as e:
            print(f"Error getting device summary: {e}")
            return {}

    def get_device_details(self, device_id: str) -> Optional[dict]:
        try:
            device = self.get_device_info(device_id)
            if not device:
                return None

            last_seen = self.get_device_last_seen(device_id)

            return {
                "device_id": device_id,
                "display_name": device.get_display_name(),
                **device.dict(),
                "last_seen": last_seen.isoformat() if last_seen else None,
            }
        except Exception as e:
            print(f"Error getting device summary: {e}")
            return None
