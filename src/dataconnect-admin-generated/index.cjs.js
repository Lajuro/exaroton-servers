const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'example',
  serviceId: 'exaroton-servers',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

function createMinecraftServer(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateMinecraftServer', inputVars, inputOpts);
};
exports.createMinecraftServer = createMinecraftServer;

function getMinecraftServer(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetMinecraftServer', inputVars, inputOpts);
};
exports.getMinecraftServer = getMinecraftServer;

function updateMinecraftServer(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateMinecraftServer', inputVars, inputOpts);
};
exports.updateMinecraftServer = updateMinecraftServer;

function deleteMinecraftServer(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('DeleteMinecraftServer', inputVars, inputOpts);
};
exports.deleteMinecraftServer = deleteMinecraftServer;

