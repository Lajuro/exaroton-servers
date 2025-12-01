const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'exaroton-servers',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createMinecraftServerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMinecraftServer', inputVars);
}
createMinecraftServerRef.operationName = 'CreateMinecraftServer';
exports.createMinecraftServerRef = createMinecraftServerRef;

exports.createMinecraftServer = function createMinecraftServer(dcOrVars, vars) {
  return executeMutation(createMinecraftServerRef(dcOrVars, vars));
};

const getMinecraftServerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMinecraftServer', inputVars);
}
getMinecraftServerRef.operationName = 'GetMinecraftServer';
exports.getMinecraftServerRef = getMinecraftServerRef;

exports.getMinecraftServer = function getMinecraftServer(dcOrVars, vars) {
  return executeQuery(getMinecraftServerRef(dcOrVars, vars));
};

const updateMinecraftServerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateMinecraftServer', inputVars);
}
updateMinecraftServerRef.operationName = 'UpdateMinecraftServer';
exports.updateMinecraftServerRef = updateMinecraftServerRef;

exports.updateMinecraftServer = function updateMinecraftServer(dcOrVars, vars) {
  return executeMutation(updateMinecraftServerRef(dcOrVars, vars));
};

const deleteMinecraftServerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteMinecraftServer', inputVars);
}
deleteMinecraftServerRef.operationName = 'DeleteMinecraftServer';
exports.deleteMinecraftServerRef = deleteMinecraftServerRef;

exports.deleteMinecraftServer = function deleteMinecraftServer(dcOrVars, vars) {
  return executeMutation(deleteMinecraftServerRef(dcOrVars, vars));
};
