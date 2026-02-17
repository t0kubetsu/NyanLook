export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  device_id: string;
}

export interface LocationHistory {
  device_id: string;
  count: number;
  history: LocationPoint[];
}

export interface DeviceSummary {
  platform: string;
  platform_version?: string;
  locale?: string;
  manufacturer?: string;
  model?: string;
  brand?: string;
  android_version?: string;
  sdk?: number;
  is_physical_device?: boolean;
  // iOS
  name?: string;
  system_version?: string;
  utsname_machine?: string;
  // Web
  browser_name?: string;
  user_agent?: string;
  language?: string;
}

export interface DeviceInfos {
  device_id: string;
  display_name: string;
  summary: DeviceSummary;
  last_seen?: string;
}

export interface Device {
  device_id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  infos: DeviceInfos;
}

export interface DevicesResponse {
  count: number;
  devices: Device[];
}

export interface DeviceDetails extends DeviceSummary {
  device_id: string;
  display_name?: string;
  supported_abis?: string[];
  supported_32bit_abis?: string[];
  supported_64bit_abis?: string[];
}
