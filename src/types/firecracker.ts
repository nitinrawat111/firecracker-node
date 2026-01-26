import { BootSource, Drive, MachineConfiguration, Vsock } from "./api";

/**
 * Represents the possible log levels for Firecracker.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/vmm/src/logger/logging.rs#L233
 */
export const LogLevels = {
  Off: "off",
  Trace: "trace",
  Debug: "debug",
  Info: "info",
  // Same as "warning"
  Warn: "warn",
  Error: "error",
} as const;
export type LogLevel = (typeof LogLevels)[keyof typeof LogLevels];

/**
 * Parameters for initializing a Firecracker microVM process.
 * These correspond to the command-line arguments supported by the Firecracker binary.
 * @see https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/src/main.rs#L144
 */
export interface FirecrackerInitParams {
  /**
   * Path to unix domain socket used by the API.
   * @default "/run/firecracker.socket"
   */
  apiSock?: string;

  /**
   * MicroVM unique identifier.
   * @default "anonymous-instance"
   */
  id?: string;

  /**
   * Optional parameter which allows specifying the path to a custom seccomp filter.
   * For advanced users. Cannot be used with noSeccomp.
   * For more details, see: https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/src/seccomp.rs#L38
   */
  seccompFilter?: string;

  /**
   * Optional parameter which allows starting and using a microVM without seccomp filtering.
   * Not recommended. Cannot be used with seccompFilter.
   * For more details, see: https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/firecracker/src/seccomp.rs#L38
   */
  noSeccomp?: boolean;

  /**
   * Process start time (wall clock, microseconds). This parameter is optional.
   */
  startTimeUs?: number;

  /**
   * Process start CPU time (wall clock, microseconds). This parameter is optional.
   */
  startTimeCpuUs?: number;

  /**
   * Parent process CPU time (wall clock, microseconds). This parameter is optional.
   */
  parentCPUTimeUs?: number;

  /**
   * Path to a file that contains the microVM configuration in JSON format.
   */
  configFile?: string;

  /**
   * Path to a file that contains metadata in JSON format to add to the mmds.
   */
  metadataFile?: string;

  /**
   * Optional parameter which allows starting and using a microVM without an active API socket.
   * Requires configFile to be specified.
   */
  noApi?: boolean;

  /**
   * Path to a fifo or a file used for configuring the logger on startup.
   */
  logPath?: string;

  /**
   * Set the logger level.
   */
  level?: LogLevel;

  /**
   * Set the logger module filter.
   */
  module?: string;

  /**
   * Whether or not to output the level in the logs.
   */
  showLevel?: boolean;

  /**
   * Whether or not to include the file path and line number of the log's origin.
   */
  showLogOrigin?: boolean;

  /**
   * Path to a fifo or a file used for configuring the metrics on startup.
   */
  metricsPath?: string;

  /**
   * Whether or not to load boot timer device for logging elapsed time since InstanceStart command.
   */
  bootTimer?: boolean;

  /**
   * Print the binary version number.
   */
  version?: boolean;

  /**
   * Print the supported data format version.
   */
  snapshotVersion?: boolean;

  /**
   * Print the data format version of the provided snapshot state file.
   */
  describeSnapshot?: string;

  /**
   * Http API request payload max size, in bytes.
   * @default 51200 (Reference: https://github.com/firecracker-microvm/firecracker/blob/f0691f8253d4bde225b9f70ecabf39b7ad796935/src/vmm/src/lib.rs#L198)
   */
  httpApiMaxPayloadSize?: number;

  /**
   * Mmds data store limit, in bytes.
   */
  mmdsSizeLimit?: number;

  /**
   * Enables PCIe support.
   */
  enablePci?: boolean;
}

/**
 * Default values for FirecrackerInitParams
 * @todo Add default value for all parameters
 */
export const DefaultFirecrackerInitParams = {
  apiSock: "/run/firecracker.socket",
  id: "anonymous-instance",
  httpApiMaxPayloadSize: 51200,
} as const satisfies FirecrackerInitParams;

/**
 * Configuration for the microVM itself
 */
export interface MicroVMConfig {
  /**
   * Boot source configuration
   */
  bootSource: BootSource;

  /**
   * Drives to attach to the microVM.
   * At least one drive is required.
   */
  drives: Drive[];

  /**
   * Machine configuration
   */
  machineConfig?: MachineConfiguration;

  /**
   * Vsock device configuration for guest-host communication.
   * Optional. If provided, a vsock device will be attached to the microVM.
   */
  vsock?: Vsock;
}
