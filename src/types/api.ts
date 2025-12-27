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
