import { loadEnvFile } from "node:process";
import IConfig from "../types/config.type";
import ILogger from "../types/logger.type";
import ConsoleLogger from "./logger";

loadEnvFile();

export default class Config implements IConfig {
    readonly logger: ILogger;
    
    constructor() {
        this.logger = new ConsoleLogger();
    }

    getPort(): number {
        const port = process.env.PORT;
        if (!port || port.trim() === "") {
            this.logger.error("Cannot read the PORT number");
            throw new Error("Cannot read the PORT number", {
                cause: {
                    variable: "process.env.PORT",
                    value: process.env.PORT,
                    reason: "The .env file or env config is incorrect"
                }
            });
        }

        const convertedPort = Number(port);
        if (Number.isNaN(convertedPort)) {
            this.logger.error("Invalid PORT number, may containing characters");
            throw new Error("Invalid PORT number, may containing characters", {
                cause: {
                    variable: "process.env.PORT",
                    value: process.env.PORT,
                    reason: "May contain invalid characters, such as non-numeric characters and whitespaces"
                }
            });
        }

        return convertedPort;
    }

    getMongoURI(): string {
        const uri = process.env.MONGODB_URI;
        if (!uri || uri.trim() === "") {
            this.logger.error("Cannot read the MONGO_URI variable");
            throw new Error("Cannot read the MONGO_URI variable", {
                cause: {
                    variable: "process.env.MONGODB_URI",
                    value: process.env.MONGODB_URI,
                    reason: "The .env file or env config is incorrect"
                }
            });
        }

        return uri;
    }
}