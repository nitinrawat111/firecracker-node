import { FirecrackerAPIClient } from "./api/api-client";

// TODO: Export relevant things here
// This is just an example usage of the API client. Added temporarily until the testing is setup
const api = new FirecrackerAPIClient("/tmp/firecracker.socket");
api.getInstanceInfo().then((info) => {
  console.log("Instance Info:", info);
});
