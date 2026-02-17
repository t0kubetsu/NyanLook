from pydantic import BaseModel, Field


class LocationData(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timestamp: int = Field(..., gt=0)
    device_id: str = Field(..., min_length=1)
