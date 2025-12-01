import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'exaroton-servers',
  location: 'us-east4'
};

export const createMinecraftServerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMinecraftServer', inputVars);
}
createMinecraftServerRef.operationName = 'CreateMinecraftServer';

export function createMinecraftServer(dcOrVars, vars) {
  return executeMutation(createMinecraftServerRef(dcOrVars, vars));
}

export const getMinecraftServerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMinecraftServer', inputVars);
}
getMinecraftServerRef.operationName = 'GetMinecraftServer';

export function getMinecraftServer(dcOrVars, vars) {
  return executeQuery(getMinecraftServerRef(dcOrVars, vars));
}

export const updateMinecraftServerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateMinecraftServer', inputVars);
}
updateMinecraftServerRef.operationName = 'UpdateMinecraftServer';

export function updateMinecraftServer(dcOrVars, vars) {
  return executeMutation(updateMinecraftServerRef(dcOrVars, vars));
}

export const deleteMinecraftServerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteMinecraftServer', inputVars);
}
deleteMinecraftServerRef.operationName = 'DeleteMinecraftServer';

export function deleteMinecraftServer(dcOrVars, vars) {
  return executeMutation(deleteMinecraftServerRef(dcOrVars, vars));
}

