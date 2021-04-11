"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPort = void 0;
const getPort = () => {
    const port = parseInt(process.env.PORT);
    if (!!port && !isNaN(port)) {
        return port;
    }
    // Default production
    if (process.env.NODE_ENV === "production") {
        return 443;
    }
    // Development default
    return 7000;
};
exports.getPort = getPort;
