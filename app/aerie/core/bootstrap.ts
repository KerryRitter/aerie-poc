import { Router } from './router';
import { CatsModule } from '../../modules/cats/cats.module';

console.log('Starting bootstrap process...');

// Register all modules here
const router = Router.getInstance();
console.log('Router instance created');

router.registerModuleRoutes(CatsModule);
console.log('Modules registered');

export { router }; 