import { CreateMinecraftServerData, CreateMinecraftServerVariables, GetMinecraftServerData, GetMinecraftServerVariables, UpdateMinecraftServerData, UpdateMinecraftServerVariables, DeleteMinecraftServerData, DeleteMinecraftServerVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateMinecraftServer(options?: useDataConnectMutationOptions<CreateMinecraftServerData, FirebaseError, CreateMinecraftServerVariables>): UseDataConnectMutationResult<CreateMinecraftServerData, CreateMinecraftServerVariables>;
export function useCreateMinecraftServer(dc: DataConnect, options?: useDataConnectMutationOptions<CreateMinecraftServerData, FirebaseError, CreateMinecraftServerVariables>): UseDataConnectMutationResult<CreateMinecraftServerData, CreateMinecraftServerVariables>;

export function useGetMinecraftServer(vars: GetMinecraftServerVariables, options?: useDataConnectQueryOptions<GetMinecraftServerData>): UseDataConnectQueryResult<GetMinecraftServerData, GetMinecraftServerVariables>;
export function useGetMinecraftServer(dc: DataConnect, vars: GetMinecraftServerVariables, options?: useDataConnectQueryOptions<GetMinecraftServerData>): UseDataConnectQueryResult<GetMinecraftServerData, GetMinecraftServerVariables>;

export function useUpdateMinecraftServer(options?: useDataConnectMutationOptions<UpdateMinecraftServerData, FirebaseError, UpdateMinecraftServerVariables>): UseDataConnectMutationResult<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;
export function useUpdateMinecraftServer(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateMinecraftServerData, FirebaseError, UpdateMinecraftServerVariables>): UseDataConnectMutationResult<UpdateMinecraftServerData, UpdateMinecraftServerVariables>;

export function useDeleteMinecraftServer(options?: useDataConnectMutationOptions<DeleteMinecraftServerData, FirebaseError, DeleteMinecraftServerVariables>): UseDataConnectMutationResult<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;
export function useDeleteMinecraftServer(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteMinecraftServerData, FirebaseError, DeleteMinecraftServerVariables>): UseDataConnectMutationResult<DeleteMinecraftServerData, DeleteMinecraftServerVariables>;
