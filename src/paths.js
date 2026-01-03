// Path alias registration for Vercel serverless environment
// This file must be imported FIRST before any other imports that use path aliases
// Using .js extension ensures it's treated as CommonJS and runs before ES6 imports

const { register } = require('tsconfig-paths');

// In Vercel, the compiled file is at /var/task/src/server.js
// So __dirname will be /var/task/src, and we need baseUrl to be /var/task/src
const baseUrl = __dirname;

// Match tsconfig.json paths configuration (baseUrl: "src")
// Paths are relative to baseUrl
const paths = {
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
};

register({
  baseUrl,
  paths,
});

