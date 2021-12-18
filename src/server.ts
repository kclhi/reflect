import build from './app';
import logger from './winston';

(async () => {
  const server = await build();
  try {
    await server.listen(server.config.PORT, '::');
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
})();
