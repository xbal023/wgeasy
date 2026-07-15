import { startBot } from './bot';
import { startApi } from './api';
import { startScheduler } from './services/scheduler.service';
import { config } from './config';
import { logger } from './utils/logger';

const main = async () => {
  try {
    startApi(config.PORT);
    startScheduler();
    await startBot();
  } catch (error) {
    logger.error(`Fatal error: ${error}`);
    process.exit(1);
  }
};

main();
