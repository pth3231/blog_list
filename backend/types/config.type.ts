export default interface IConfig {
  getPort(): number
  getMongoURI(): string
}