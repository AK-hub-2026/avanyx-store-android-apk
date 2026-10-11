import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const app = require('../backend/src/index');

export default app;
