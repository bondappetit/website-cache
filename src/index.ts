import 'module-alias/register';
import container from './container';
import * as router from './api/router';
import { getCircl } from './api/getCircl';

container.model
  .migrationService()
  .up()
  .then(() => {
    const web = container.webServer();
    web.express.get('/', async (req, res) => res.send('ok'));
    web.express.get('/circl', getCircl);
    router.use(web);

    web.listen().then(({ port }) => container.logger().info(`Listen ${port}`));
  });
