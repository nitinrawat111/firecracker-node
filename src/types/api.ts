/**
 * Represents the possible states of a Firecracker instance.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1321
 */
export const InstanceStates = {
  NotStarted: "Not Started",
  Paused: "Paused",
  Running: "Running",
} as const;
export type InstanceState =
  (typeof InstanceStates)[keyof typeof InstanceStates];

/**
 * Represents the information of an instance.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1321
 */
export interface InstanceInfo {
  /**
   * Application name
   */
  app_name: string;
  /**
   * MicroVM / Instance ID
   */
  id: string;
  /**
   * The current detailed state (Not started, Running, Paused) of the Firecracker instance.
   * This value is read-only for the control-plane.
   */
  state: InstanceState;
  /**
   * MicroVM hypervisor build version.
   */
  vmm_version: string;
}

/**
 * Represents an error response from the Firecracker API.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1259
 */
export interface FirecrackerAPIError {
  fault_message: string;
}

/**
 * Actions that can be performed on a Firecracker instance.
 * These can be specified in the PUT `/actions` endpoint.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1306
 */
export const InstanceActions = {
  InstanceStart: "InstanceStart",
  FlushMetrics: "FlushMetrics",
  SendCtrlAltDel: "SendCtrlAltDel",
} as const;
export type InstanceAction =
  (typeof InstanceActions)[keyof typeof InstanceActions];

/**
 * Wrapper containing the action to be performed on the instance.
 * This is the body expected by the PUT `/actions` endpoint.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1306
 */
export interface InstanceActionInfo {
  action_type: InstanceAction;
}

/**
 * A boot source descriptor
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1029
 */
export interface BootSource {
  /**
   * Kernel boot arguments
   */
  boot_args?: string;
  /**
   * Host level path to the kernel image used to boot the guest
   */
  initrd_path?: string;
  /**
   * Host level path to the initrd image used to boot the guest
   */
  kernel_image_path: string;
}

/**
 *  Defines a token bucket with a maximum capacity (size), an initial burst size
 *  (one_time_burst) and an interval for refilling purposes (refill_time).
 *
 *  - The refill-rate is derived from size and refill_time, and it is the constant
 *  rate at which the tokens replenish. The refill process only starts happening after
 *  the initial burst budget is consumed.
 *  - Consumption from the token bucket is unbounded in speed which allows for bursts
 *  bound in size by the amount of tokens available.
 *  - Once the token bucket is empty, consumption speed is bound by the refill_rate.
 *
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1636
 */
export interface TokenBucket {
  /**
   * The initial size of a token bucket.
   */
  size: number;
  /**
   * The number of bytes/operations added to the bucket per second.
   */
  refill_time: number;

  one_time_burst?: number;
}

/**
 * Defines an IO rate limiter with independent bytes/s and ops/s limits.
 * Limits are defined by configuring each of the _bandwidth_ and _ops_ token buckets.
 * This field is optional for virtio-block config and should be omitted for vhost-user-block configuration.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1541
 */
export interface RateLimiter {
  /**
   * Bandwidth rate limiter
   */
  bandwidth?: TokenBucket;
  /**
   * Operations per second rate limiter
   */
  ops?: TokenBucket;
}

/**
 * Represents the possible caching strategies for block devices.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1199
 */
export const CacheTypes = {
  Unsafe: "Unsafe",
  Writeback: "Writeback",
} as const;
export type CacheType = (typeof CacheTypes)[keyof typeof CacheTypes];

/**
 * Represents the possible IO engine types.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1219
 */
export const IOEngineTypes = {
  Sync: "Sync",
  Async: "Async",
} as const;
export type IOEngineType = (typeof IOEngineTypes)[keyof typeof IOEngineTypes];

/**
 * A drive descriptor for configuring block devices.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1183
 */
export interface Drive {
  /**
   * Unique identifier for the drive
   */
  drive_id: string;
  /**
   * Represents the unique id of the boot partition of this device.
   * It is optional and it will be taken into account only if the is_root_device field is true.
   */
  partuuid?: string;
  /**
   * Whether this drive is the root device
   */
  is_root_device: boolean;
  /**
   * Represents the caching strategy for the block device.
   */
  cache_type?: CacheType;
  /**
   * Is block read only.
   * This field is required for virtio-block config and should be omitted for vhost-user-block configuration.
   */
  is_read_only?: boolean;
  /**
   * Host level path for the guest drive.
   * This field is required for virtio-block config and should be omitted for vhost-user-block configuration.
   */
  path_on_host?: string;
  /**
   * Rate limiter configuration
   */
  rate_limiter?: RateLimiter;
  /**
   * Type of the IO engine used by the device. "Async" is supported on host kernels newer than 5.10.51.
   * This field is optional for virtio-block config and should be omitted for vhost-user-block configuration.
   */
  io_engine?: IOEngineType;
  /**
   * Path to the socket of vhost-user-block backend.
   * This field is required for vhost-user-block config should be omitted for virtio-block configuration.
   */
  socket?: string;
}

/**
 * Partial drive descriptor for updating drive properties post-boot.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1511
 */
export interface PartialDrive {
  /**
   * Unique identifier for the drive
   */
  drive_id: string;
  /**
   * Host level path for the guest drive.
   * This field is optional for virtio-block config and should be omitted for vhost-user-block configuration.
   */
  path_on_host?: string;
  /**
   * Rate limiter configuration
   */
  rate_limiter?: RateLimiter;
}

/**
 * Represents the possible CPU templates.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1046
 */
export const CPUTemplates = {
  None: "None",
  C3: "C3",
  T2: "T2",
  T2S: "T2S",
  T2CL: "T2CL",
  T2A: "T2A",
  V1N1: "V1N1",
} as const;
export type CPUTemplate = (typeof CPUTemplates)[keyof typeof CPUTemplates];

/**
 * Represents the possible huge pages configurations.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1410
 */
export const HugePagesConfigs = {
  None: "None",
  "2M": "2M",
} as const;
export type HugePagesConfig =
  (typeof HugePagesConfigs)[keyof typeof HugePagesConfigs];

/**
 * Describes the number of vCPUs, memory size, SMT capabilities, huge page configuration and the CPU template.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1376
 */
export interface MachineConfiguration {
  /**
   * The CPU Template defines a set of flags to be disabled from the microvm so that
   * the features exposed to the guest are the same as in the selected instance type.
   * This parameter has been deprecated and it will be removed in future Firecracker
   * release.
   * @default "None"
   * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/swagger/firecracker.yaml#L1046
   */
  cpu_template?: CPUTemplate;
  /**
   * Flag for enabling/disabling simultaneous multithreading. Can be enabled only on x86.
   * @default false
   */
  smt?: boolean;
  /**
   * Memory size of VM
   * @default 128
   */
  mem_size_mib: number;
  /**
   * Enable dirty page tracking. If this is enabled, then incremental guest memory
   * snapshots can be created. These belong to diff snapshots, which contain, besides
   * the microVM state, only the memory dirtied since a previous snapshot. Full snapshots
   * each contain a full copy of the guest memory.
   * @default false
   */
  track_dirty_pages?: boolean;
  /**
   * Number of vCPUs (either 1 or an even number)
   * @default 1
   * - Minimum: 1
   * - Maximum: 32
   */
  vcpu_count: number;
  /**
   * Which huge pages configuration (if any) should be used to back guest memory.
   * @default None
   */
  huge_pages?: HugePagesConfig;
}
