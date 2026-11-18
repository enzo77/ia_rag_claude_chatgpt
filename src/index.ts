import { startCli } from "./chat/cli.js";

startCli().catch((error: Error) => {
  console.error("Error", error.message);
  process.exit(1)
});
