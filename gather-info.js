const templatePkg = require('./package.json');
const opensearchDashboardsPkg = require('../../package.json');

const debugInfo = {
  opensearchDashboards: {
    version: opensearchDashboardsPkg.version,
    build: opensearchDashboardsPkg.build,
    engines: opensearchDashboardsPkg.engines,
  },
  plugin: {
    name: templatePkg.name,
    version: templatePkg.version,
    opensearchDashboards: templatePkg.opensearchDashboards,
    dependencies: templatePkg.dependencies,
  },
};

console.log(debugInfo);
