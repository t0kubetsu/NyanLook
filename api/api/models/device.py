from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class PlatformType(str, Enum):
    ANDROID = "android"
    IOS = "ios"
    WEB = "web"
    LINUX = "linux"
    MACOS = "macos"
    WINDOWS = "windows"


class AndroidDeviceData(BaseModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    brand: Optional[str] = None
    device: Optional[str] = None
    product: Optional[str] = None
    fingerprint: Optional[str] = None
    android_version: Optional[str] = None
    sdk: Optional[int] = None
    hardware: Optional[str] = None
    board: Optional[str] = None
    bootloader: Optional[str] = None
    display: Optional[str] = None
    host: Optional[str] = None
    tags: Optional[str] = None
    type: Optional[str] = None
    is_physical_device: Optional[bool] = None
    supported_abis: Optional[List[str]] = None
    supported_32bit_abis: Optional[List[str]] = None
    supported_64bit_abis: Optional[List[str]] = None


class IOSDeviceData(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    system_name: Optional[str] = None
    system_version: Optional[str] = None
    is_physical_device: Optional[bool] = None
    utsname_machine: Optional[str] = None
    utsname_sysname: Optional[str] = None
    utsname_release: Optional[str] = None
    utsname_version: Optional[str] = None


class WebDeviceData(BaseModel):
    browser_name: Optional[str] = None
    app_name: Optional[str] = None
    app_version: Optional[str] = None
    user_agent: Optional[str] = None
    platform: Optional[str] = None
    vendor: Optional[str] = None
    language: Optional[str] = None


class DeviceData(BaseModel):
    # Required fields (common to all platforms)
    device_id: str = Field(..., min_length=1, description="Unique device identifier")
    platform: str = Field(..., description="Operating system (android, ios, web, etc.)")

    # Common optional fields
    platform_version: Optional[str] = Field(None, description="OS version string")
    locale: Optional[str] = Field(None, description="Device locale (e.g., en_US)")

    # Android-specific fields
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    brand: Optional[str] = None
    device: Optional[str] = None
    product: Optional[str] = None
    fingerprint: Optional[str] = None
    android_version: Optional[str] = None
    sdk: Optional[int] = Field(None, ge=1, description="Android SDK version")
    hardware: Optional[str] = None
    board: Optional[str] = None
    bootloader: Optional[str] = None
    display: Optional[str] = None
    host: Optional[str] = None
    tags: Optional[str] = None
    type: Optional[str] = None
    is_physical_device: Optional[bool] = None
    supported_abis: Optional[List[str]] = None
    supported_32bit_abis: Optional[List[str]] = None
    supported_64bit_abis: Optional[List[str]] = None

    # iOS-specific fields
    name: Optional[str] = None
    system_name: Optional[str] = None
    system_version: Optional[str] = None
    utsname_machine: Optional[str] = None
    utsname_sysname: Optional[str] = None
    utsname_release: Optional[str] = None
    utsname_version: Optional[str] = None

    # Web-specific fields
    browser_name: Optional[str] = None
    app_name: Optional[str] = None
    app_version: Optional[str] = None
    user_agent: Optional[str] = None
    vendor: Optional[str] = None
    language: Optional[str] = None

    class Config:
        use_enum_values = True

    def get_platform_type(self) -> PlatformType:
        platform_lower = self.platform.lower()
        try:
            return PlatformType(platform_lower)
        except ValueError:
            return self.platform

    def is_android(self) -> bool:
        return self.platform.lower() == "android"

    def is_ios(self) -> bool:
        return self.platform.lower() == "ios"

    def is_web(self) -> bool:
        return self.platform.lower() in ["web", "web browser"]

    def get_display_name(self) -> str:
        if self.is_android():
            return f"{self.manufacturer or 'Unknown'} {self.model or 'Device'}"
        elif self.is_ios():
            return f"{self.name or 'iOS Device'} ({self.model or 'Unknown'})"
        elif self.is_web():
            return f"{self.browser_name or 'Web Browser'}"
        else:
            return f"{self.platform} Device"

    def to_summary(self) -> dict:
        summary = {
            "platform": self.platform,
            "platform_version": self.platform_version,
            "locale": self.locale,
        }

        if self.is_android():
            summary.update(
                {
                    "manufacturer": self.manufacturer,
                    "model": self.model,
                    "android_version": self.android_version,
                    "sdk": self.sdk,
                    "is_physical_device": self.is_physical_device,
                }
            )
        elif self.is_ios():
            summary.update(
                {
                    "name": self.name,
                    "model": self.model,
                    "system_version": self.system_version,
                    "is_physical_device": self.is_physical_device,
                }
            )
        elif self.is_web():
            summary.update(
                {
                    "browser": self.browser_name,
                    "user_agent": self.user_agent,
                }
            )

        return summary
