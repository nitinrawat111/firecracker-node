import { FirecrackerAPIClient } from "./api/api-client";
import { InstanceActions } from "./types/api";

// TODO: Export relevant things here
// This is just an example usage of the API client. Added temporarily until the testing is setup
const api = new FirecrackerAPIClient("/tmp/firecracker.socket");
api
  .setBootSource({
    kernel_image_path: "/home/azios/Downloads/vmlinux",
  })
  .then(() => {
    api.startAction(InstanceActions.InstanceStart).then((info) => {
      console.log("Instance Info:", info);
    });
  });
