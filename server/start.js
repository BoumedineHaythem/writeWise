import { createApp } from './index.js';
import { config } from './config.js';
import { purgeExpiredTokens } from './auth.js';

purgeExpiredTokens();
setInterval(purgeExpiredTokens, 6 * 3600000).unref();

createApp().listen(config.port, () => {
  console.log(`Writewise API listening on http://localhost:${config.port}`);
  console.log(
    `Feedback engine: ${config.aiFeedback ? `Claude (${config.aiModel}), with built-in fallback` : 'built-in analyzer'}`
  );
});
