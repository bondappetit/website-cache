import 'module-alias/register';
import container from './container';
import * as router from './api/router';
import { getCircl } from './api/getCircl';
import { getCirclStable } from './api/getCirclStable';

container.model
  .migrationService
  .up()
  .then(() => {
    const web = container.webServer();
    web.express.get('/', async (req, res) => res.send('ok'));
    web.express.get('/circl', getCircl);
    web.express.get('/circl-stable', getCirclStable);
    router.use(web);

    web.listen().then(({ port }) => container.logger.info(`Listen ${port}`));
  });
