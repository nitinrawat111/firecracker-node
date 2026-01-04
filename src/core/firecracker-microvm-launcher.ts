import {
  BootSource,
  Drive,
  InstanceActions,
  MachineConfiguration,
} from "../types/api";
import {
  DefaultFirecrackerInitParams,
  FirecrackerInitParams,
} from "../types/firecracker";
import { FirecrackerMicroVM } from "./firecracker-microvm";

/**
 * A builder class for setting up and launching a Firecracker microVM instance.
 *
 * This class allows you to configure the boot source, drives, and machine configuration
 * before launching the microVM.
 *
 * @note
 * If you want to manually control the Firecracker process and API calls, consider using FirecrackerMicroVM directly.
 *
 * @example
 * const launcher = new FirecrackerMicroVMLauncher({
 *   apiSock: "/tmp/firecracker.socket",
 * });
 *
 * launcher
 *   .setBootSource({
 *     kernel_image_path: "/path/to/kernel",
 *     boot_args: "console=ttyS0 reboot=k panic=1 pci=off",
 *   })
 *   .addDrive({
 *     drive_id: "rootfs",
 *     path_on_host: "/path/to/rootfs.ext4",
 *     is_root_device: true,
 *     is_read_only: false,
 *   })
 *   .setMachineConfiguration({
 *     vcpu_count: 2,
 *     mem_size_mib: 512,
 *   });
 *
 * // Launch the microVM
 * // This will start the firecrafcker process, configure the VM, and start it
 * const instance = await launcher.launch();
 */
export class FirecrackerMicroVMLauncher {
  private firecrackerInitParams: FirecrackerInitParams =
    DefaultFirecrackerInitParams;
  private bootSource?: BootSource;
  private drives: Drive[] = [];
  private machineConfiguration?: MachineConfiguration;

  constructor(initParams?: FirecrackerInitParams) {
    // This is done to ensure that any missing parameters in initParams are filled with defaults
    // Firecracker will use the default values if not provided
    // But we also want to have the default values available in this.firecrackerInitParams
    this.firecrackerInitParams = {
      ...DefaultFirecrackerInitParams,
      ...initParams,
    };
  }

  /**
   * Set the boot source for the Firecracker microVM.
   * @param bootSource The boot source configuration.
   * @returns The FirecrackerMicroVMLauncher instance.
   */
  setBootSource(bootSource: BootSource): FirecrackerMicroVMLauncher {
    this.bootSource = bootSource;
    return this;
  }

  /**
   * Add a drive to the Firecracker microVM.
   * @param drive The drive configuration.
   * @returns The FirecrackerMicroVMLauncher instance.
   */
  addDrive(drive: Drive): FirecrackerMicroVMLauncher {
    this.drives.push(drive);
    return this;
  }

  /**
   * Set the machine configuration for the Firecracker microVM.
   * @param machineConfiguration The machine configuration.
   * @returns The FirecrackerMicroVMLauncher instance.
   */
  setMachineConfiguration(
    machineConfiguration: MachineConfiguration,
  ): FirecrackerMicroVMLauncher {
    this.machineConfiguration = machineConfiguration;
    return this;
  }

  /**
   * Launch the Firecracker microVM.
   * This methods does the following:
   *  1. Spawns the Firecracker process.
   *  2. Configures the boot source.
   *  3. Adds the drives.
   *  4. Sets the machine configuration (if provided).
   *  5. Starts the microVM.
   *
   * @warning Calling this method multiple times will spawn multiple Firecracker processes.
   * @todo Maybe return some wrapper around FirecrackerMicroVM that only exposes post-boot methods?
   * @returns The instance of the launched Firecracker microVM.
   */
  async launch() {
    if (this.bootSource === undefined) {
      throw new Error(
        "Boot source must be set before launching the Firecracker microVM.",
      );
    }

    if (this.drives.length === 0) {
      throw new Error(
        "At least one drive must be added before launching the Firecracker microVM.",
      );
    }

    const firecrackerInstance = new FirecrackerMicroVM(
      this.firecrackerInitParams,
    );
    await firecrackerInstance.spawnFirecrackerProcess(true);
    await firecrackerInstance.setBootSource(this.bootSource);
    await Promise.all(
      this.drives.map((drive) =>
        firecrackerInstance.createOrUpdateDrive(drive),
      ),
    );

    if (this.machineConfiguration !== undefined) {
      await firecrackerInstance.setMachineConfiguration(
        this.machineConfiguration,
      );
    }

    await firecrackerInstance.startAction(InstanceActions.InstanceStart);
    return firecrackerInstance;
  }
}
