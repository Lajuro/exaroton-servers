import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface CreateMinecraftServerData {
  minecraftServer_insert: MinecraftServer_Key;
}

export interface CreateMinecraftServerVariables {
  name: string;
  serverId: string;
  ownerId: UUIDString;
  createdAt: TimestampString;
  gameMode?: string | null;
  ipAddress?: string | null;
  maxPlayers?: number | null;
  minecraftVersion?: string | null;
  port?: number | null;
  serverSoftware?: string | null;
  status: string;
}

export interface DeleteMinecraftServerData {
  minecraftServer_delete?: MinecraftServer_Key | null;
}

export interface DeleteMinecraftServerVariables {
  id: UUIDString;
}

export interface GetMinecraftServerData {
  minecraftServer?: {
    id: UUIDString;
    name: string;
    serverId: string;
    ownerId?: UUIDString | null;
    createdAt: TimestampString;
    gameMode?: string | null;
    ipAddress?: string | null;
    maxPlayers?: number | null;
    minecraftVersion?: string | null;
    port?: number | null;
    serverSoftware?: string | null;
    status: string;
  } & MinecraftServer_Key;
}

export interface GetMinecraftServerVariables {
  id: UUIDString;
}

export interface Invitation_Key {
  id: UUIDString;
  __typename?: 'Invitation_Key';
}

export interface MinecraftServer_Key {
  id: UUIDString;
  __typename?: 'MinecraftServer_Key';
}

export interface ServerAccess_Key {
  userId: UUIDString;
  serverId: UUIDString;
  __typename?: 'ServerAccess_Key';
}

export interface ServerLog_Key {
  id: UUIDString;
  __typename?: 'ServerLog_Key';
}

export interface UpdateMinecraftServerData {
  minecraftServer_update?: MinecraftServer_Key | null;
}

export interface UpdateMinecraftServerVariables {
  id: UUIDString;
  name?: string | null;
  gameMode?: string | null;
  ipAddress?: string | null;
  maxPlayers?: number | null;
  minecraftVersion?: string | null;
  port?: number | null;
  serverSoftware?: string | null;
  status?: string | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'CreateMinecraftServer' Mutation. Allow users to execute without passing in DataConnect. */
export function createMinecraftServer(dc: DataConnect, vars: CreateMinecraftServerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateMinecraftServerData>>;
/** Generated Node Admin SDK operation action function for the 'CreateMinecraftServer' Mutation. Allow users to pass in custom DataConnect instances. */
export function createMinecraftServer(vars: CreateMinecraftServerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateMinecraftServerData>>;

/** Generated Node Admin SDK operation action function for the 'GetMinecraftServer' Query. Allow users to execute without passing in DataConnect. */
export function getMinecraftServer(dc: DataConnect, vars: GetMinecraftServerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMinecraftServerData>>;
/** Generated Node Admin SDK operation action function for the 'GetMinecraftServer' Query. Allow users to pass in custom DataConnect instances. */
export function getMinecraftServer(vars: GetMinecraftServerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMinecraftServerData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateMinecraftServer' Mutation. Allow users to execute without passing in DataConnect. */
export function updateMinecraftServer(dc: DataConnect, vars: UpdateMinecraftServerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateMinecraftServerData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateMinecraftServer' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateMinecraftServer(vars: UpdateMinecraftServerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateMinecraftServerData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteMinecraftServer' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteMinecraftServer(dc: DataConnect, vars: DeleteMinecraftServerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteMinecraftServerData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteMinecraftServer' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteMinecraftServer(vars: DeleteMinecraftServerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteMinecraftServerData>>;

