# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMinecraftServer*](#getminecraftserver)
- [**Mutations**](#mutations)
  - [*CreateMinecraftServer*](#createminecraftserver)
  - [*UpdateMinecraftServer*](#updateminecraftserver)
  - [*DeleteMinecraftServer*](#deleteminecraftserver)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMinecraftServer
You can execute the `GetMinecraftServer` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMinecraftServer(vars: GetMinecraftServerVariables): QueryPromise<GetMinecraftServerData, GetMinecraftServerVariables>;

interface GetMinecraftServerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMinecraftServerVariables): QueryRef<GetMinecraftServerData, GetMinecraftServerVariables>;
}
export const getMinecraftServerRef: GetMinecraftServerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMinecraftServer(dc: DataConnect, vars: GetMinecraftServerVariables): QueryPromise<GetMinecraftServerData, GetMinecraftServerVariables>;

interface GetMinecraftServerRef {
  ...
  (dc: DataConnect, vars: GetMinecraftServerVariables): QueryRef<GetMinecraftServerData, GetMinecraftServerVariables>;
}
export const getMinecraftServerRef: GetMinecraftServerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMinecraftServerRef:
```typescript
const name = getMinecraftServerRef.operationName;
console.log(name);
```

### Variables
The `GetMinecraftServer` query requires an argument of type `GetMinecraftServerVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetMinecraftServerVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetMinecraftServer` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMinecraftServerData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetMinecraftServer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMinecraftServer, GetMinecraftServerVariables } from '@dataconnect/generated';

// The `GetMinecraftServer` query requires an argument of type `GetMinecraftServerVariables`:
const getMinecraftServerVars: GetMinecraftServerVariables = {
  id: ..., 
};

// Call the `getMinecraftServer()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMinecraftServer(getMinecraftServerVars);
// Variables can be defined inline as well.
const { data } = await getMinecraftServer({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMinecraftServer(dataConnect, getMinecraftServerVars);

console.log(data.minecraftServer);

// Or, you can use the `Promise` API.
getMinecraftServer(getMinecraftServerVars).then((response) => {
  const data = response.data;
  console.log(data.minecraftServer);
});
```

### Using `GetMinecraftServer`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMinecraftServerRef, GetMinecraftServerVariables } from '@dataconnect/generated';

// The `GetMinecraftServer` query requires an argument of type `GetMinecraftServerVariables`:
const getMinecraftServerVars: GetMinecraftServerVariables = {
  id: ..., 
};

// Call the `getMinecraftServerRef()` function to get a reference to the query.
const ref = getMinecraftServerRef(getMinecraftServerVars);
// Variables can be defined inline as well.
const ref = getMinecraftServerRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMinecraftServerRef(dataConnect, getMinecraftServerVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.minecraftServer);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.minecraftServer);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateMinecraftServer
You can execute the `CreateMinecraftServer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createMinecraftServer(vars: CreateMinecraftServerVariables): MutationPromise<CreateMinecraftServerData, CreateMinecraftServerVariables>;

interface CreateMinecraftServerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMinecraftServerVariables): MutationRef<CreateMinecraftServerData, CreateMinecraftServerVariables>;
}
export const createMinecraftServerRef: CreateMinecraftServerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createMinecraftServer(dc: DataConnect, vars: CreateMinecraftServerVariables): MutationPromise<CreateMinecraftServerData, CreateMinecraftServerVariables>;

interface CreateMinecraftServerRef {
  ...
  (dc: DataConnect, vars: CreateMinecraftServerVariables): MutationRef<CreateMinecraftServerData, CreateMinecraftServerVariables>;
}
export const createMinecraftServerRef: CreateMinecraftServerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createMinecraftServerRef:
```typescript
const name = createMinecraftServerRef.operationName;
console.log(name);
```

### Variables
The `CreateMinecraftServer` mutation requires an argument of type `CreateMinecraftServerVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateMinecraftServer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateMinecraftServerData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateMinecraftServerData {
  minecraftServer_insert: MinecraftServer_Key;
}
```
### Using `CreateMinecraftServer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createMinecraftServer, CreateMinecraftServerVariables } from '@dataconnect/generated';

// The `CreateMinecraftServer` mutation requires an argument of type `CreateMinecraftServerVariables`:
const createMinecraftServerVars: CreateMinecraftServerVariables = {
  name: ..., 
  serverId: ..., 
  ownerId: ..., 
  createdAt: ..., 
  gameMode: ..., // optional
  ipAddress: ..., // optional
  maxPlayers: ..., // optional
  minecraftVersion: ..., // optional
  port: ..., // optional
  serverSoftware: ..., // optional
  status: ..., 
};

// Call the `createMinecraftServer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createMinecraftServer(createMinecraftServerVars);
// Variables can be defined inline as well.
const { data } = await createMinecraftServer({ name: ..., serverId: ..., ownerId: ..., createdAt: ..., gameMode: ..., ipAddress: ..., maxPlayers: ..., minecraftVersion: ..., port: ..., serverSoftware: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createMinecraftServer(dataConnect, createMinecraftServerVars);

console.log(data.minecraftServer_insert);

// Or, you can use the `Promise` API.
createMinecraftServer(createMinecraftServerVars).then((response) => {
  const data = response.data;
  console.log(data.minecraftServer_insert);
});
```

### Using `CreateMinecraftServer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createMinecraftServerRef, CreateMinecraftServerVariables } from '@dataconnect/generated';

// The `CreateMinecraftServer` mutation requires an argument of type `CreateMinecraftServerVariables`:
const createMinecraftServerVars: CreateMinecraftServerVariables = {
  name: ..., 
  serverId: ..., 
  ownerId: ..., 
  createdAt: ..., 
  gameMode: ..., // optional
  ipAddress: ..., // optional
  maxPlayers: ..., // optional
  minecraftVersion: ..., // optional
  port: ..., // optional
  serverSoftware: ..., // optional
  status: ..., 
};

// Call the `createMinecraftServerRef()` function to get a reference to the mutation.
const ref = createMinecraftServerRef(createMinecraftServerVars);
// Variables can be defined inline as well.
const ref = createMinecraftServerRef({ name: ..., serverId: ..., ownerId: ..., createdAt: ..., gameMode: ..., ipAddress: ..., maxPlayers: ..., minecraftVersion: ..., port: ..., serverSoftware: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createMinecraftServerRef(dataConnect, createMinecraftServerVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.minecraftServer_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.minecraftServer_insert);
});
```

## UpdateMinecraftServer
You can execute the `UpdateMinecraftServer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateMinecraftServer(vars: UpdateMinecraftServerVariables): MutationPromise<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;

interface UpdateMinecraftServerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateMinecraftServerVariables): MutationRef<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;
}
export const updateMinecraftServerRef: UpdateMinecraftServerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateMinecraftServer(dc: DataConnect, vars: UpdateMinecraftServerVariables): MutationPromise<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;

interface UpdateMinecraftServerRef {
  ...
  (dc: DataConnect, vars: UpdateMinecraftServerVariables): MutationRef<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;
}
export const updateMinecraftServerRef: UpdateMinecraftServerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateMinecraftServerRef:
```typescript
const name = updateMinecraftServerRef.operationName;
console.log(name);
```

### Variables
The `UpdateMinecraftServer` mutation requires an argument of type `UpdateMinecraftServerVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateMinecraftServer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateMinecraftServerData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateMinecraftServerData {
  minecraftServer_update?: MinecraftServer_Key | null;
}
```
### Using `UpdateMinecraftServer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateMinecraftServer, UpdateMinecraftServerVariables } from '@dataconnect/generated';

// The `UpdateMinecraftServer` mutation requires an argument of type `UpdateMinecraftServerVariables`:
const updateMinecraftServerVars: UpdateMinecraftServerVariables = {
  id: ..., 
  name: ..., // optional
  gameMode: ..., // optional
  ipAddress: ..., // optional
  maxPlayers: ..., // optional
  minecraftVersion: ..., // optional
  port: ..., // optional
  serverSoftware: ..., // optional
  status: ..., // optional
};

// Call the `updateMinecraftServer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateMinecraftServer(updateMinecraftServerVars);
// Variables can be defined inline as well.
const { data } = await updateMinecraftServer({ id: ..., name: ..., gameMode: ..., ipAddress: ..., maxPlayers: ..., minecraftVersion: ..., port: ..., serverSoftware: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateMinecraftServer(dataConnect, updateMinecraftServerVars);

console.log(data.minecraftServer_update);

// Or, you can use the `Promise` API.
updateMinecraftServer(updateMinecraftServerVars).then((response) => {
  const data = response.data;
  console.log(data.minecraftServer_update);
});
```

### Using `UpdateMinecraftServer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateMinecraftServerRef, UpdateMinecraftServerVariables } from '@dataconnect/generated';

// The `UpdateMinecraftServer` mutation requires an argument of type `UpdateMinecraftServerVariables`:
const updateMinecraftServerVars: UpdateMinecraftServerVariables = {
  id: ..., 
  name: ..., // optional
  gameMode: ..., // optional
  ipAddress: ..., // optional
  maxPlayers: ..., // optional
  minecraftVersion: ..., // optional
  port: ..., // optional
  serverSoftware: ..., // optional
  status: ..., // optional
};

// Call the `updateMinecraftServerRef()` function to get a reference to the mutation.
const ref = updateMinecraftServerRef(updateMinecraftServerVars);
// Variables can be defined inline as well.
const ref = updateMinecraftServerRef({ id: ..., name: ..., gameMode: ..., ipAddress: ..., maxPlayers: ..., minecraftVersion: ..., port: ..., serverSoftware: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateMinecraftServerRef(dataConnect, updateMinecraftServerVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.minecraftServer_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.minecraftServer_update);
});
```

## DeleteMinecraftServer
You can execute the `DeleteMinecraftServer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteMinecraftServer(vars: DeleteMinecraftServerVariables): MutationPromise<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;

interface DeleteMinecraftServerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteMinecraftServerVariables): MutationRef<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;
}
export const deleteMinecraftServerRef: DeleteMinecraftServerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteMinecraftServer(dc: DataConnect, vars: DeleteMinecraftServerVariables): MutationPromise<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;

interface DeleteMinecraftServerRef {
  ...
  (dc: DataConnect, vars: DeleteMinecraftServerVariables): MutationRef<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;
}
export const deleteMinecraftServerRef: DeleteMinecraftServerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteMinecraftServerRef:
```typescript
const name = deleteMinecraftServerRef.operationName;
console.log(name);
```

### Variables
The `DeleteMinecraftServer` mutation requires an argument of type `DeleteMinecraftServerVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteMinecraftServerVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteMinecraftServer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteMinecraftServerData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteMinecraftServerData {
  minecraftServer_delete?: MinecraftServer_Key | null;
}
```
### Using `DeleteMinecraftServer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteMinecraftServer, DeleteMinecraftServerVariables } from '@dataconnect/generated';

// The `DeleteMinecraftServer` mutation requires an argument of type `DeleteMinecraftServerVariables`:
const deleteMinecraftServerVars: DeleteMinecraftServerVariables = {
  id: ..., 
};

// Call the `deleteMinecraftServer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteMinecraftServer(deleteMinecraftServerVars);
// Variables can be defined inline as well.
const { data } = await deleteMinecraftServer({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteMinecraftServer(dataConnect, deleteMinecraftServerVars);

console.log(data.minecraftServer_delete);

// Or, you can use the `Promise` API.
deleteMinecraftServer(deleteMinecraftServerVars).then((response) => {
  const data = response.data;
  console.log(data.minecraftServer_delete);
});
```

### Using `DeleteMinecraftServer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteMinecraftServerRef, DeleteMinecraftServerVariables } from '@dataconnect/generated';

// The `DeleteMinecraftServer` mutation requires an argument of type `DeleteMinecraftServerVariables`:
const deleteMinecraftServerVars: DeleteMinecraftServerVariables = {
  id: ..., 
};

// Call the `deleteMinecraftServerRef()` function to get a reference to the mutation.
const ref = deleteMinecraftServerRef(deleteMinecraftServerVars);
// Variables can be defined inline as well.
const ref = deleteMinecraftServerRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteMinecraftServerRef(dataConnect, deleteMinecraftServerVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.minecraftServer_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.minecraftServer_delete);
});
```

