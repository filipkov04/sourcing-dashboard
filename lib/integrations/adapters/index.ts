import { integrationManager } from "../manager";
import { RestAdapter } from "./rest-adapter";
import { SftpAdapter } from "./sftp-adapter";
import { WebhookAdapter } from "./webhook-adapter";

// All three integration types registered
integrationManager.registerAdapter(new RestAdapter());
integrationManager.registerAdapter(new SftpAdapter());
integrationManager.registerAdapter(new WebhookAdapter());
