import { integrationManager } from "../manager";
import { RestAdapter } from "./rest-adapter";

// Register all adapters here — more added in tasks 7.7 (SFTP) and 7.9 (Webhook)
integrationManager.registerAdapter(new RestAdapter());
