import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface CreateMinecraftServerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMinecraftServerVariables): MutationRef<CreateMinecraftServerData, CreateMinecraftServerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateMinecraftServerVariables): MutationRef<CreateMinecraftServerData, CreateMinecraftServerVariables>;
  operationName: string;
}
export const createMinecraftServerRef: CreateMinecraftServerRef;

export function createMinecraftServer(vars: CreateMinecraftServerVariables): MutationPromise<CreateMinecraftServerData, CreateMinecraftServerVariables>;
export function createMinecraftServer(dc: DataConnect, vars: CreateMinecraftServerVariables): MutationPromise<CreateMinecraftServerData, CreateMinecraftServerVariables>;

interface GetMinecraftServerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMinecraftServerVariables): QueryRef<GetMinecraftServerData, GetMinecraftServerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetMinecraftServerVariables): QueryRef<GetMinecraftServerData, GetMinecraftServerVariables>;
  operationName: string;
}
export const getMinecraftServerRef: GetMinecraftServerRef;

export function getMinecraftServer(vars: GetMinecraftServerVariables): QueryPromise<GetMinecraftServerData, GetMinecraftServerVariables>;
export function getMinecraftServer(dc: DataConnect, vars: GetMinecraftServerVariables): QueryPromise<GetMinecraftServerData, GetMinecraftServerVariables>;

interface UpdateMinecraftServerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateMinecraftServerVariables): MutationRef<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateMinecraftServerVariables): MutationRef<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;
  operationName: string;
}
export const updateMinecraftServerRef: UpdateMinecraftServerRef;

export function updateMinecraftServer(vars: UpdateMinecraftServerVariables): MutationPromise<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;
export function updateMinecraftServer(dc: DataConnect, vars: UpdateMinecraftServerVariables): MutationPromise<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;

interface DeleteMinecraftServerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteMinecraftServerVariables): MutationRef<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteMinecraftServerVariables): MutationRef<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;
  operationName: string;
}
export const deleteMinecraftServerRef: DeleteMinecraftServerRef;

export function deleteMinecraftServer(vars: DeleteMinecraftServerVariables): MutationPromise<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;
export function deleteMinecraftServer(dc: DataConnect, vars: DeleteMinecraftServerVariables): MutationPromise<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;

