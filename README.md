# firecracker-node

Type-safe TypeScript client for controlling Firecracker microVMs.

## Warning

_This is an early-stage project and is still under active development. The API may change significantly in future releases. Use with caution in production environments._

## Documentation

Take a look at the docs [here](https://nitinrawat111.github.io/firecracker-node/)

## Quickstart

```typescript
import { FirecrackerAPIClient, InstanceActions } from "firecracker-node";

async function main() {
  // Point to the Firecracker API socket (e.g. /tmp/firecracker.socket)
  const api = new FirecrackerAPIClient("/tmp/firecracker.socket");

  // Provide the kernel image and args
  await api.setBootSource({
    kernel_image_path: "./hello-vmlinux.bin",
    boot_args: "console=ttyS0 reboot=k panic=1 pci=off",
  });

  // Attach the rootfs
  await api.createOrUpdateDrive({
    drive_id: "rootfs",
    path_on_host: "./hello-rootfs.ext4",
    is_root_device: true,
    is_read_only: false,
  });

  // Start the instance
  await api.startAction(InstanceActions.InstanceStart);
}

main().catch((err) => {
  console.error("failed to start VM:", err);
});
```
