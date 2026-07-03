import { ConnectOptions } from 'mongoose'

export default interface IDBConfig {
  uri: string;
  options: ConnectOptions;
}