import {PoolConnection, Query} from 'mysql';
import SqlString from './sqlstring';

//@types
import {InsertConfig, UpdateConfig, SelectConfig} from './type';

class Transaction {
    _connect: PoolConnection;

    constructor(connect: PoolConnection) {
        this._connect = connect;
    }

    /**
     * 事务的回滚
     */
    rollback(): Promise<any> {
        return new Promise((resolve, reject) => {
            this._connect.rollback(() => {
                resolve();
            })
        })
    }

    /**
     * 事务提交
     */
    commit(): Promise<any> {
        return new Promise((resolve, reject) => {
            this._connect.commit((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                    this._connect.release();
                }
            })
        })
    }

    /**
     * 处理where中的属性
     * @param where
     * @private
     */
    _where(where: object): string {
        if (!where) {
            return ''
        }

        const wheres = [];
        const values = [];

        for (const key in where) {
            if (where.hasOwnProperty(key)) {
                const value = where[key];
                if (Array.isArray(value)) {
                    wheres.push('?? IN (?)');
                } else {
                    wheres.push('?? = ?');
                }
                values.push(key);
                values.push(value);
            }
        }

        if (wheres.length > 0) {
            return this._format(' WHERE ' + wheres.join(' AND '), values);
        }
        return '';
    }

    /**
     * 格式化sql
     * @param sql
     * @param values
     * @param stringifyObjects
     * @param timeZone
     * @private
     */
    _format(sql: string, values?: Array<any> | object, stringifyObjects?: object, timeZone?: object): string {
        if (!Array.isArray(values) && typeof values === 'object' && values !== null) {
            return sql.replace(/\:(\w+)/g, (txt, key) => {
                if (values.hasOwnProperty(key)) {
                    return SqlString.escape(values[key]);
                }
                return txt;
            });
        }

        return SqlString.format(sql, values, stringifyObjects, timeZone);
    }

    /**
     * 格式化取值列
     * @param tableName
     * @param columns
     * @private
     */
    _columns(tableName: string, columns: Array<string> | string): string {
        if (!columns) {
            columns = '*';
        }

        let sql;
        if (columns === '*') {
            sql = this._format('SELECT * FROM ??', [tableName]);
        } else {
            sql = this._format('SELECT ?? FROM ??', [columns, tableName]);
        }
        return sql;
    }

    _escapeId(value: string, forbidQualified?: boolean): string {
        return SqlString.escapeId(value, forbidQualified);
    }

    /**
     * 格式化排序
     * @param orders
     * @private
     */
    _orders(orders: Array<Array<string>>): string {
        if (!orders) {
            return '';
        }
        const values = [];
        for (const value of orders) {
            let sort = value[1].toUpperCase();
            if (sort !== 'ASC' && sort !== 'DESC') {
                sort = null;
            }
            if (sort) {
                values.push(this._escapeId(value[0]) + ' ' + sort);
            } else {
                values.push(this._escapeId(value[0]));
            }
        }
        return ' ORDER BY ' + values.join(', ');
    }

    /**
     * 格式化分页
     * @param limit
     * @param offset
     * @private
     */
    _limit(limit?: number, offset?: number): string {
        if (!limit) {
            return '';
        }
        if (!offset) {
            offset = 0;
        }
        return ` LIMIT ${offset}, ${limit}`;
    }

    _query(sql: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            console.log(sql);
            this._connect.query(sql, (error, results: Query, fields) => {
                if (!error) {
                    resolve(results);
                } else {
                    reject(error)
                }
            })
        });
    }

    /**
     * 直接执行sql语句
     * @param sql
     */
    query(sql: string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                const res = await this._query(sql);
                resolve(res);
            } catch (e) {
                reject(e)
            }
        })
    }

    /**
     * 查询操作
     * @param tableName
     * @param config
     */
    select(tableName: string, config: SelectConfig): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            const sql = `${this._columns(tableName, config.columns)}${this._where(config.where)}${this._orders(config.orders)}${this._limit(config.limit, config.offset)}`;
            try {
                const res = await this._query(sql);
                resolve(res);
            } catch (e) {
                reject(e)
            }
        })
    }

    /**
     * 插入操作
     * @param tableName
     * @param rows
     * @param config
     */
    insert(tableName: string, rows: any, config?: InsertConfig): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            config = config || {};
            let firstObj;
            // insert(table, rows)
            if (Array.isArray(rows)) {
                firstObj = rows[0];
            } else {
                // insert(table, row)
                firstObj = rows;
                rows = [rows];
            }
            if (!config.columns) {
                config.columns = Object.keys(firstObj);
            }

            const params = [tableName, config.columns];
            const strs = [];
            for (const row of rows) {
                const values = [];
                for (const item of config.columns) {
                    values.push(row[item]);
                }
                strs.push('(?)');
                params.push(values);
            }

            const sql = this._format('INSERT INTO ??(??) VALUES' + strs.join(', '), params);

            try {
                const res = await this._query(sql);
                resolve(res);
            } catch (e) {
                reject(e)
            }
        })
    }

    /**
     * 更新操作
     * @param tableName
     * @param row
     * @param config
     */
    update(tableName: string, row: object, config: UpdateConfig): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            config = config || {};
            if (!config.columns) {
                config.columns = Object.keys(row);
            }

            if (!config.where) {
                throw new Error('mast have update sql query string.');
            }

            const sets = [];
            const values = [];
            for (const column of config.columns) {
                // if (column in config.where) {
                //     continue;
                // }
                sets.push('?? = ?');
                values.push(column);
                values.push(row[column]);
            }

            const sql = `${this._format('UPDATE ?? SET ', [tableName])}${this._format(sets.join(', '), values)}${this._where(config.where)}`;

            try {
                const res = await this._query(sql);
                resolve(res);
            } catch (e) {
                reject(e)
            }
        })
    }

    /**
     * 删除操作
     * @param tableName
     * @param where
     */
    delete(tableName: string, where: object): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const sql = `${this._format('DELETE FROM ??', [tableName])}${this._where(where)}`;
            try {
                const res = await this._query(sql);
                resolve(res);
            } catch (e) {
                reject(e)
            }
        })
    }
}

export default Transaction;
