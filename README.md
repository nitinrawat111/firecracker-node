# firecracker-node

Type-safe TypeScript SDK for Firecracker microVMs.

## Warning

_This is an early-stage project and is still under active development. The API may change significantly in future releases. DO NOT use in production environments._

## Documentation

Take a look at the docs [here](https://nitinrawat111.github.io/firecracker-node/)

## Quickstart

### 1. Using FirecrackerMicroVM Static Builder (Recommended)

The easiest way to launch a microVM. Spawns the process, configures, and boots in one call.

```typescript
import { FirecrackerMicroVM } from "firecracker-node";

async function main() {
  // Create and boot a microVM.
  // This returns a running FirecrackerMicroVM instance
  const vm = await FirecrackerMicroVM.create(
    // Firecracker process init params
    {
      apiSock: "/tmp/firecracker.socket",
    },
    // MicroVM configuration (boot source, drives, machine config)
    {
      bootSource: {
        kernel_image_path: "./vmlinux-6.1.155",
        boot_args: "console=ttyS0 reboot=k panic=1 pci=off",
      },
      drives: [
        {
          drive_id: "rootfs",
          path_on_host: "./ubuntu-24.04.squashfs.upstream",
          is_root_device: true,
          is_read_only: false,
        },
      ],
      machineConfig: {
        vcpu_count: 2,
        mem_size_mib: 512,
      },
    },
  );

  // VM is now running, interact with it
  const info = await vm.getInstanceInfo();
  console.log("VM is running:", info.state);

  // When done, cleanup the VM
  await vm.cleanup();
}

main().catch((err) => {
  console.error("Failed to start VM:", err);
});
```

---

### 2. Using FirecrackerAPIClient (Advanced)

Use `FirecrackerAPIClient` when you're managing the Firecracker process yourself (e.g., via systemd, or manual spawn) and only need to interact with the API.

```typescript
import { FirecrackerAPIClient, InstanceActions } from "firecracker-node";

async function main() {
  // Connect to an already-running Firecracker socket
  const api = new FirecrackerAPIClient("/tmp/firecracker.socket");

  // Configure boot source
  await api.setBootSource({
    kernel_image_path: "./vmlinux.bin",
    boot_args: "console=ttyS0 reboot=k panic=1 pci=off",
  });

  // Attach rootfs drive
  await api.createOrUpdateDrive({
    drive_id: "rootfs",
    path_on_host: "./rootfs.ext4",
    is_root_device: true,
    is_read_only: false,
  });

  // Start the instance
  await api.startAction(InstanceActions.InstanceStart);

  // Query instance info
  const info = await api.getInstanceInfo();
  console.log("Instance:", info.id, "State:", info.state);
}

main().catch((err) => {
  console.error("Failed to start VM:", err);
});
```

## Contributing

The project is in early stages and needs community suggestions/feedback. Feel free to open issues or submit pull requests!
