"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
});
exports.prisma = prisma;
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger_1.logger.debug('Query: ' + e.query);
        logger_1.logger.debug('Params: ' + e.params);
        logger_1.logger.debug('Duration: ' + e.duration + 'ms');
    });
}
prisma.$on('error', (e) => {
    logger_1.logger.error('Database error:', e);
});
prisma.$on('warn', (e) => {
    logger_1.logger.warn('Database warning:', e);
});
prisma.$on('info', (e) => {
    logger_1.logger.info('Database info:', e);
});
prisma.$connect()
    .then(() => {
    logger_1.logger.info('Database connected successfully');
})
    .catch((error) => {
    logger_1.logger.error('Failed to connect to database:', error);
    process.exit(1);
});
exports.default = prisma;
//# sourceMappingURL=database.js.map