import { Container, singleton } from '@services/Container';
import { ModelContainer } from '@models/container';
import * as Logger from '@services/Logger/Console';
import * as Express from '@services/WebServer/Express';
import * as Database from '@services/Database/Postgresql';
import * as Web3 from '@services/Ethereum/Web3';
import * as Network from '@services/Network/Network';
import config from './config';

class AppContainer extends Container<typeof config> {
  readonly logger = singleton(Logger.factory());

  readonly webServer = singleton(Express.factory(this.parent.container.webServer));

  readonly database = singleton(Database.factory(this.parent.container.database));

  readonly ethereum = singleton(Web3.httpFactory(this.parent.container.ethereum));

  readonly network = Network.factory;

  readonly model = new ModelContainer(this);
}

export default new AppContainer(config);
