import { register } from 'tsconfig-paths';

register({
  baseUrl: __dirname,
  paths: {
    '@/*': ['*'],
    '@config': ['config'],
    '@controllers/*': ['controllers/*'],
    '@dtos/*': ['dtos/*'],
    '@exceptions/*': ['exceptions/*'],
    '@interfaces/*': ['interfaces/*'],
    '@middlewares/*': ['middlewares/*'],
    '@routes/*': ['routes/*'],
    '@services/*': ['services/*'],
    '@utils/*': ['utils/*'],
  },
});
