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
