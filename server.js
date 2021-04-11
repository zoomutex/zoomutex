"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const utils_1 = require("./utils");
const helmet_1 = __importDefault(require("helmet"));
const sockets_1 = __importDefault(require("./sockets"));
const path_1 = __importDefault(require("path"));
const peerServer_1 = __importDefault(require("./peerServer"));
dotenv.config();
const PORT = utils_1.getPort();
// Express
const app = express_1.default();
app.use(helmet_1.default());
app.use(cors_1.default());
app.use(express_1.default.json());
if (process.env.NODE_ENV === "production") {
    app.use(express_1.default.static(path_1.default.join(__dirname, "client")));
    app.get("/*", (req, res) => {
        res.sendFile(path_1.default.join(__dirname, "client", "index.html"));
    });
}
// HTTP server
const httpServer = http_1.createServer(app);
// Sockets
sockets_1.default(httpServer);
app.use("/peerjs", peerServer_1.default(httpServer));
// HTTP server listen
httpServer.listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
});
