from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request

from api.core.auth import Token, login, require_auth
from api.core.db import get_kvstore
from api.models.device import DeviceData
from api.models.location import LocationData
from api.services.device_storage import DeviceStorage
from api.services.location_storage import LocationStorage

router = APIRouter()
location_storage = LocationStorage(get_kvstore())
device_storage = DeviceStorage(get_kvstore())

Protected = Annotated[str, Depends(require_auth)]


# ── PUBLIC ─────────────────────────────────────────────────────────────────────


@router.post("/auth/token", response_model=Token, tags=["auth"])
async def get_token(token: Annotated[Token, Depends(login)]):
    return token


@router.post("/{full_path:path}", tags=["ingest"])
async def catch_all_post(full_path: str, request: Request):
    try:
        data = await request.json()

        has_location_fields = all(
            k in data for k in ["latitude", "longitude", "timestamp", "device_id"]
        )
        has_device_fields = "platform" in data and "device_id" in data

        if has_location_fields:
            location_data = LocationData(**data)
            data_dict = location_data.dict()
            location_storage.store_latest_location(location_data.device_id, data_dict)
            location_storage.store_location_history(location_data.device_id, data_dict)
            print(f"✓ Stored location for device: {location_data.device_id}")
            return {"status": "ok"}

        elif has_device_fields:
            device_data = DeviceData(**data)
            device_storage.store_device_info(device_data.device_id, device_data)
            print(f"✓ Stored device info: {device_data.get_display_name()}")
            return {"status": "ok"}

    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Invalid data: {str(e)}")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ── PROTECTED ──────────────────────────────────────────────────────────────────


@router.get("/devices", tags=["devices"])
async def get_all_devices(_: Protected):
    device_ids = location_storage.get_all_active_devices()
    devices = []
    for device_id in device_ids:
        latest_location = location_storage.get_latest_location(device_id)
        device_summary = device_storage.get_device_summary(device_id)
        if not latest_location:
            continue
        devices.append(
            {
                "device_id": device_id,
                "latitude": latest_location["latitude"],
                "longitude": latest_location["longitude"],
                "timestamp": latest_location["timestamp"],
                "infos": device_summary or {},
            }
        )
    return {"count": len(devices), "devices": devices}


@router.get("/device/{device_id}", tags=["devices"])
async def get_device_infos(device_id: str, _: Protected):
    infos = device_storage.get_device_summary(device_id)
    if not infos:
        raise HTTPException(status_code=404, detail="Device not found")
    latest_location = location_storage.get_latest_location(device_id)
    if latest_location:
        infos["latitude"] = latest_location["latitude"]
        infos["longitude"] = latest_location["longitude"]
        infos["timestamp"] = latest_location["timestamp"]
    return infos


@router.get("/device/{device_id}/location", tags=["devices"])
async def get_device_latest(device_id: str, _: Protected):
    location = location_storage.get_latest_location(device_id)
    if not location:
        raise HTTPException(status_code=404, detail="Device not found")
    return location


@router.get("/device/{device_id}/location/history", tags=["devices"])
async def get_device_history(device_id: str, _: Protected, limit: int = 100):
    history = location_storage.get_location_history(device_id, limit)
    return {"device_id": device_id, "count": len(history), "history": history}


@router.get("/device/{device_id}/location/stats", tags=["devices"])
async def get_device_stats(device_id: str, _: Protected):
    stats = location_storage.get_device_stats(device_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Device not found")
    return stats


@router.get("/device/{device_id}/details", tags=["devices"])
async def get_device_details(device_id: str, _: Protected):
    stats = device_storage.get_device_details(device_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Device not found")
    return stats
