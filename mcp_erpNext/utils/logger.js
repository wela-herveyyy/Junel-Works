export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export class Logger {
    level;
    constructor(level = LogLevel.INFO) {
        this.level = level;
    }
    setLevel(level) {
        this.level = level;
    }
    error(message, ...meta) {
        if (this.level >= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`, ...meta);
        }
    }
    warn(message, ...meta) {
        if (this.level >= LogLevel.WARN) {
            console.error(`[WARN] ${message}`, ...meta);
        }
    }
    info(message, ...meta) {
        if (this.level >= LogLevel.INFO) {
            console.error(`[INFO] ${message}`, ...meta);
        }
    }
    debug(message, ...meta) {
        if (this.level >= LogLevel.DEBUG) {
            console.error(`[DEBUG] ${message}`, ...meta);
        }
    }
}
export function createLogger() {
    const level = process.env.DEBUG === "1" || process.env.DEBUG === "true"
        ? LogLevel.DEBUG
        : LogLevel.INFO;
    return new Logger(level);
}
