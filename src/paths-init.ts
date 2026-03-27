import { register } from 'tsconfig-paths';
import path from 'path';

// Only register paths in development (when running ts-node)
// In production, paths are resolved at build time by tsc-alias
if (process.env.NODE_ENV !== 'production') {
  register({
    baseUrl: path.resolve(__dirname, '..', 'src'),
    paths: {
      '@/*': ['*'],
      '@config': ['config'],
      '@controllers/*': ['controllers/*'],
      '@dtos/*': ['dtos/*'],
      '@/exceptions/*': ['exceptions/*'],
      '@/interfaces/*': ['interfaces/*'],
      '@/middlewares/*': ['middlewares/*'],
      '@routes/*': ['routes/*'],
      '@services/*': ['services/*'],
      '@/utils/*': ['utils/*'],
    },
  });
}
