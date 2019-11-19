import { Pool, Query } from 'mysql';
import Transaction from './transaction';
import SqlString from './sqlstring';
import RelationalDatabase from './relationalDatabase';

//@types
import { InsertConfig, UpdateConfig, SelectConfig } from './type';

class Mysql extends RelationalDatabase {
    _connect: Pool;
    _log: boolean;

    constructor(connect: Pool) {
        super();
        this._connect = connect;
        this._log = false;
    }

    log(log: boolean): void {
        this._log = log;
    }

    delete(tableName: string, where: object): Promise<any> {
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
            const str = [];
            for (const row of rows) {
                const values = [];
                for (const item of config.columns) {
                    values.push(row[item]);
                }
                str.push('(?)');
                params.push(values);
            }

            const sql = this._format('INSERT INTO ??(??) VALUES' + str.join(', '), params);

            try {
                const res = await this._query(sql);
                resolve(res);
            } catch (e) {
                reject(e)
            }
        })
    }

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

    count(tableName: string, config: SelectConfig): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            const sql = `${this._format('SELECT COUNT(*) as count FROM ??', [tableName])}${this._where(config.where)}${this._orders(config.orders)}${this._limit(config.limit, config.offset)}`;
            try {
                const res = await this._query(sql);
                resolve(res);
            } catch (e) {
                reject(e)
            }
        })
    }

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

    beginTransaction(): Promise<Transaction> {
        return new Promise((resolve, reject) => {
            this._connect.getConnection((err1, connection) => {
                if (err1) {
                    console.log(`获取连接错误：${err1.stack}\n连接ID：${connection.threadId}`);
                    reject(err1);
                } else {
                    connection.beginTransaction((err2) => {
                        if (err2) {
                            console.log(`初始化事务失败：${err2}`);
                            reject(err2);
                        } else {
                            resolve(new Transaction(connection));
                        }
                    })
                }
            })
        });
    }

    _format(sql: string, values?: Array<any> | object, stringifyObjects?: object, timeZone?: object): string {
        if (!Array.isArray(values) && typeof values === 'object' && values !== null) {
            return sql.replace(/:(\w+)/g, (txt, key) => {
                if (values.hasOwnProperty(key)) {
                    return SqlString.escape(values[key]);
                }
                return txt;
            });
        }

        return SqlString.format(sql, values, stringifyObjects, timeZone);
    }

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
            if (this._log) {
                console.log(sql);
            }
            this._connect.getConnection((err, c) => {
                if (!err) {
                    c.query(sql, (error, results: Query, fields) => {
                        if (!error) {
                            resolve(results);
                            c.release();
                        } else {
                            reject(error)
                        }
                    })
                } else {
                    reject(err);
                }
            });
        });
    }

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
}

export default Mysql;
