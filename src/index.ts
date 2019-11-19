import * as mysql from 'mysql';
import * as redis from 'redis';
import Mysql from './mysql';
import Redis from './redis';

//@types
import {DatabaseConfig} from './type';

class Orm {
    _host: string;
    _database?: string;
    _password: string;
    _port: number;
    _user?: string;
    _databaseConnection: any;
    _type: string;
    _client: redis.RedisClient;

    constructor(config: DatabaseConfig) {
        this._host = config.host;
        this._database = config.database ? config.database : null;
        this._password = config.password ? config.password : null;
        this._port = config.port;
        this._user = config.user;
        this._type = config.type;

        if (['mysql', 'redis'].indexOf(config.type) < 0) {
            throw new Error('type not support');
        }
    }

    connect(): Promise<any> {
        if (this._type === 'mysql') {
            return new Promise<Mysql>((resolve, reject) => {
                const connection = mysql.createPool({
                    host: this._host,
                    user: this._user,
                    port: this._port,
                    password: this._password,
                    database: this._database,
                    timezone: 'Asia/Shanghai',
                });
                this._databaseConnection = new Mysql(connection);
                resolve(this._databaseConnection);
            })
        }
        if (this._type === 'redis') {
            return new Promise<Redis>((resolve, reject) => {
                const config = {
                    port: this._port,
                    host: this._host,
                };
                if (this._password) {
                    config['password'] = this._password;
                }
                if (this._database) {
                    config['db'] = this._database;
                }
                this._client = redis.createClient(config);
                this._client.on('error', (error) => {
                    reject(error);
                });
                this._client.info((err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        const client = new Redis(this._client);
                        resolve(client);
                    }
                })
            })
        }
        if (['mysql', 'redis'].indexOf(this._type) < 0) {
            return new Promise<any>((resolve, reject) => {
                reject(new Error('数据库类型不支持'));
            })
        }
    }
}

export default Orm;
export {Mysql, Redis};
