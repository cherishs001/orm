import * as redis from 'redis';

class Redis {
    _connect: redis.RedisClient;

    constructor(connect: redis.RedisClient) {
        this._connect = connect;
    }

    /**
     * 插入记录
     * @param key 查询键
     * @param value 值
     */
    set(key: string, value: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this._connect.set(key, value, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res) {
                        resolve();
                    } else {
                        reject(new Error('设置新记录失败'));
                    }
                }
            })
        })
    }

    /**
     * 查询记录
     * @param key 查询键
     */
    get(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this._connect.get(key, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res) {
                        resolve(res);
                    } else {
                        reject(new Error('获取数据失败'));
                    }
                }
            })
        })
    }

    /**
     * 设置哈希记录
     * @param namespace 哈希表名称
     * @param obj
     */
    hSet(namespace: string, obj: object): Promise<any> {
        return new Promise((resolve, reject) => {
            const tmp = [];
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    tmp.push(key);
                    tmp.push(obj[key]);
                }
            }
            this._connect.hmset(namespace, ...tmp, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res) {
                        resolve();
                    } else {
                        reject(new Error('设置哈希记录失败'));
                    }
                }
            })
        })
    }

    /**
     * 获取哈希表记录
     * @param namespace 哈希表名称
     * @param keyList 要取得字段得key
     */
    hGet(namespace: string, keyList: Array<string>): Promise<any> {
        return new Promise((resolve, reject) => {
            this._connect.hmget(namespace, ...keyList, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res) {
                        // 构造key-value对象
                        const tmp = {};
                        keyList.map((item, index) => {
                            tmp[item] = res[index];
                        });
                        resolve(tmp);
                    } else {
                        reject(new Error('获取哈希记录失败'));
                    }
                }
            });
        })
    }

    /**
     * 设置redis内key的有效时间
     * @param key redis内的顶级名称
     * @param ttl 有效时间
     */
    expire(key: string, ttl: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this._connect.expire(key, ttl, (number) => {
                resolve(number);
            })
        })
    }

    /**
     * 删除某个key
     * @param key redis内的顶级名称
     * @constructor
     */
    delete(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this._connect.del(key, (number) => {
                resolve(number);
            });
        })
    }
}

export default Redis;
