import { createLogger, format, transports, addColors } from 'winston';

const levels = {
  emerg: 0,
  error: 1,
  warn: 2,
  info: 3,
  notice: 4,
  debug: 5,
};

const logColors = {
  emerg: 'redBG white bold',
  error: 'red',
  warn: 'yellow',
  notice: 'cyan',
  info: 'green',
  debug: 'blue',
};

addColors(logColors);

const loggerLevel = process.env.LOGGER_LEVEL;

const filesFormat = format.combine(
  format.timestamp(),
  format.uncolorize(),
  format.json()
);

export const getLogger = () =>
  createLogger({
    levels,
    level: loggerLevel,
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format.colorize({ all: true }),
      format.printf(
        (info) =>
          `${info.timestamp} ${info.level}: ${info.message}` +
          (info.splat !== undefined ? `${info.splat}` : ' ')
      )
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      new transports.Console({ level: loggerLevel }),
      new transports.File({
        filename: 'logs/allLogs.log',
        level: loggerLevel,
        format: filesFormat,
      }),
      new transports.File({
        filename: 'logs/errors.log',
        level: 'error',
        format: filesFormat,
      }),
    ],
  });
