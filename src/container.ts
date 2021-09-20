import { Container, singleton } from '@services/Container';
import { ModelContainer } from '@models/container';
import * as Logger from '@services/Logger/Console';
import * as Express from '@services/WebServer/Express';
import * as Database from '@services/Database/Postgresql';
import * as Web3 from '@services/Ethereum/Web3';
import * as Network from '@services/Network/Network';
import * as PriceFeed from '@services/PriceFeed';
import * as VolumeFeed from '@services/VolumeFeed';
import * as Medium from '@services/Medium/Rss';
import { MemoryCache } from '@services/Cache/Memory';
import config from './config';

class AppContainer extends Container<typeof config> {
  readonly logger = new Logger.ConsoleLogger();

  readonly webServer = Express.factory(this.parent.container.webServer);

  readonly database = Database.factory(this.parent.container.database);

  readonly ethereum = Web3.networkResolverHttpFactory(this.parent.container.ethereum);

  readonly network = Network.factory;

  readonly priceFeed = PriceFeed.factory(this.ethereum, this.parent.container.priceFeed);

  readonly volumeFeed = VolumeFeed.factory(this.ethereum, this.parent.container.volumeFeed);

  readonly medium = Medium.factory(this.parent.container.medium.url);

  readonly memoryCache = new MemoryCache();

  readonly model = new ModelContainer(this);
}

export default new AppContainer(config);
