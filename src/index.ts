import 'module-alias/register';
import container from './container';
import * as router from './api/router';

container.model
  .migrationService()
  .up()
  .then(() => {
    const web = container.webServer();
    web.express.get('/', async (req, res) => {
      const blockNumber = await container.ethereum().eth.getBlockNumber();
      res.send(blockNumber.toString());
    });
    router.use(web);

    web.listen().then(({ port }) => container.logger().info(`Listen ${port}`));
  });
