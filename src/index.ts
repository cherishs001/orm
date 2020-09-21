import * as mysql from 'mysql2';

class Mysql {
    private host: string;
    private port: number;
    private username: string;
    private password: string;
    private database: string;
    private pool: mysql.Pool;

    constructor(host: string, port: number, username: string, password: string, database: string) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.database = database;
        this.pool = mysql.createPool({
            host: this.host,
            user: this.username,
            password: this.password,
            port: this.port,
            database: this.database,
        });
    }

    authenticate(): Database {
        return new Database(this.pool);
    }
}

class Database {
    sql: string = '';
    private tableName: string = '';
    private client: mysql.Pool;
    private logsFlag: boolean = false;

    constructor(client: mysql.Pool) {
        this.client = client;
    }


    table(tableName: string): Database {
        this.tableName = tableName;
        return this;
    }

    query(sql: string): Database {
        this.sql = sql;
        return this;
    }

    select(): Select {
        return new Select(this.tableName, this);
    }

    insert(): Insert {
        return new Insert(this.tableName, this);
    }

    update(): Update {
        return new Update(this.tableName, this);
    }

    delete(): Delete {
        return new Delete(this.tableName, this);
    }

    replace(): Replace {
        return new Replace(this.tableName, this);
    }

    logs(logsFlag: boolean): Database {
        this.logsFlag = logsFlag;
        return this;
    }

    exec(): Promise<any> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.getConnection((err, conn) => {
                if (err) {
                    if (this.logsFlag) {
                        console.log(`[sql][error][${self.sql}]`);
                    }
                    reject(err);
                } else {
                    conn.query(self.sql, (qerr, vals) => {
                        conn.release();
                        if (qerr) {
                            if (this.logsFlag) {
                                console.log(`[sql][error][${self.sql}]`);
                            }
                            reject(qerr);
                        } else {
                            if (this.logsFlag) {
                                console.log(`[sql][success][${self.sql}]`);
                            }
                            resolve(vals)
                        }
                    })
                }
            })
        })
    }
}

class Search {
    sql: string = '';

    whereConditions: Array<{ [propsName: string]: any }> = [];
    joinConditions: string[] = [];
    columns: string[] = [];
    orders: any[] = [];
    offsetNumber: number = 0;
    offsetflag: boolean = false;
    limitNumber: number = 0;
    limitflag: boolean = false;
    groupFields: string[] = [];
    tableName: string = '';
    sqlType: 'select' | 'update' | 'delete' | 'insert' | 'replace' = 'select';
    createValues: { [propsName: string]: any } = {};
    setValues: { [propsName: string]: any } = {};

    constructor(sqlType: 'select' | 'update' | 'delete' | 'insert' | 'replace', tableName: string) {
        this.sqlType = sqlType;
        this.tableName = tableName;
    }

    finish(): Search {
        let sql: string = this.sqlType + '';
        let whereStr = '';
        if (this.whereConditions.length > 0) {
            whereStr = ' where ';
            let whereIndex = 1;
            for (const item of this.whereConditions) {
                // 先判断字符串中的占位符数量
                const placeholder = item.args.length;
                // item.query.split('').reduce((m: any, i: string) => {
                //     if (i === '?') {
                //         placeholder = placeholder + 1;
                //     }
                // }, '?');
                let query = item.query;
                // 在这两个占位符范围内找数据
                for (let index = 0; index < placeholder; index = index + 1) {
                    if (Array.isArray(item.args[index])) {
                        let args = '';
                        for (let i = 0; i < item.args[index].length; i = i + 1) {
                            if (i === item.args[index].length - 1) {
                                if (typeof item.args[index][i] === 'string') {
                                    args = args + `'${item.args[index][i]}'`;
                                } else {
                                    args = args + item.args[index][i];
                                }
                            } else {
                                if (typeof item.args[index][i] === 'string') {
                                    args = args + `'${item.args[index][i]}'` + ', ';
                                } else {
                                    args = args + item.args[index][i] + ', ';
                                }
                            }
                        }
                        query = query.replace('?', args);
                    } else if (typeof item.args[index] === 'string') {
                        query = query.replace('?', `'${item.args[index]}'`);
                    } else {
                        query = query.replace('?', item.args[index]);
                    }
                }
                if (whereIndex === this.whereConditions.length) {
                    whereStr = whereStr + query;
                } else {
                    whereStr = whereStr + query + ' and ';
                }
                whereIndex = whereIndex + 1;
                // whereList.push(query);
            }
            // whereStr += whereList.join(' and ');
        }

        let createFields = '';
        let createValues = '';
        const createFieldsList = Object.keys(this.createValues);
        if (createFieldsList.length > 0) {
            createFields = createFieldsList.join(', ');
            // 按顺序把内容填上
            const createValuesList = [];
            for (const item of createFieldsList) {
                createValuesList.push(this.createValues[item]);
            }
            for (let i = 0; i < createValuesList.length; i++) {
                if (i === createValuesList.length - 1) {
                    if (typeof createValuesList[i] === 'string') {
                        createValues = createValues + `'${createValuesList[i]}'`;
                    } else {
                        createValues = createValues + createValuesList[i];
                    }
                } else {
                    if (typeof createValuesList[i] === 'string') {
                        createValues = createValues + `'${createValuesList[i]}'` + ', ';
                    } else {
                        createValues = createValues + createValuesList[i] + ', ';
                    }
                }
            }
        }

        let setValues = '';
        const setFieldsList = Object.keys(this.setValues);
        if (setFieldsList.length > 0) {
            // 按顺序把内容填上
            const setValuesList = [];
            for (const item of setFieldsList) {
                if (typeof this.setValues[item] === 'string') {
                    setValuesList.push(`${item}='${this.setValues[item]}'`);
                } else {
                    setValuesList.push(`${item}=${this.setValues[item]}`);
                }
            }
            setValues = ` set ${setValuesList.join(', ')}`;
        }

        let orderStr = ' order by ';
        const orderStrList = [];
        for (const item of this.orders) {
            orderStrList.push(`${item[0]} ${item[1]}`);
        }
        orderStr = orderStr + orderStrList.join(', ');

        const groupStr = ` group by ${this.groupFields.join(', ')}`;

        const joinStr = this.joinConditions.join(' ');

        if (this.sqlType === 'select') {
            if (this.columns.length === 0) {
                sql = sql + ' * ';
            } else {
                sql = sql + ` ${this.columns.join(', ')} `;
            }
            sql = `${sql}from ${this.tableName}${this.joinConditions.length > 0 ? ' ' + joinStr : ''}${whereStr}${this.groupFields.length > 0 ? groupStr : ''}${this.orders.length > 0 ? orderStr : ''}${this.limitflag ? ` limit ${this.limitNumber}` : ''}${this.offsetflag ? ` offset ${this.offsetNumber}` : ''}`;
        }

        if (this.sqlType === 'insert') {
            sql = sql + ' into ';
            sql = `${sql}${this.tableName} (${createFields}) values(${createValues})`;
        }

        if (this.sqlType === 'replace') {
            sql = sql + ' into ';
            sql = `${sql}${this.tableName} (${createFields}) values(${createValues})`;
        }

        if (this.sqlType === 'update') {
            sql = `${sql} ${this.tableName}${setValues}${whereStr}`;
        }

        if (this.sqlType === 'delete') {
            sql = `${sql} from ${this.tableName}${whereStr}`;
        }

        sql = sql + ';'
        this.sql = sql;
        return this;
    }
}

class Update {
    private search: Search;
    private database: Database;
    constructor(tableName: string, database: Database) {
        this.search = new Search('update', tableName);
        this.database = database;
    }

    set(values: { [propsName: string]: any }): Update {
        this.search.setValues = values;
        return this;
    }

    where(query: string, ...values: any): Update {
        this.search.whereConditions.push({
            query: query,
            args: values,
        });
        return this;
    }

    finish(): Database {
        this.database.sql = this.search.finish().sql;
        return this.database;
    }
}

class Insert {
    private search: Search;
    private database: Database;
    constructor(tableName: string, database: Database) {
        this.search = new Search('insert', tableName);
        this.database = database;
    }

    values(values: { [propsName: string]: any }): Insert {
        this.search.createValues = values;
        return this;
    }

    finish(): Database {
        this.database.sql = this.search.finish().sql;
        return this.database;
    }
}

class Replace {
    private search: Search;
    private database: Database;
    constructor(tableName: string, database: Database) {
        this.search = new Search('replace', tableName);
        this.database = database;
    }

    values(values: { [propsName: string]: any }): Replace {
        this.search.createValues = values;
        return this;
    }

    finish(): Database {
        this.database.sql = this.search.finish().sql;
        return this.database;
    }
}

class Delete {
    private search: Search;
    private database: Database;
    constructor(tableName: string, database: Database) {
        this.search = new Search('delete', tableName);
        this.database = database;
    }

    where(query: string, ...values: any): Delete {
        this.search.whereConditions.push({
            query: query,
            args: values,
        });
        return this;
    }

    finish(): Database {
        this.database.sql = this.search.finish().sql;
        return this.database;
    }
}

class Select {
    private search: Search;
    private database: Database;
    constructor(tableName: string, database: Database) {
        this.search = new Search('select', tableName);
        this.database = database;
    }

    column(columnName: string): Select {
        this.search.columns.push(columnName);
        return this;
    }

    joins(joinStr: string): Select {
        this.search.joinConditions.push(joinStr);
        return this;
    }

    where(query: string, ...values: any): Select {
        this.search.whereConditions.push({
            query: query,
            args: values,
        });
        return this;
    }

    group(groupFields: string[]): Select {
        this.search.groupFields = groupFields;
        return this;
    }

    order(orders: any[]): Select {
        this.search.orders = orders;
        return this;
    }

    limit(limit: number): Select {
        this.search.limitNumber = limit;
        this.search.limitflag = true;
        return this;
    }

    offset(offset: number): Select {
        this.search.offsetNumber = offset;
        this.search.offsetflag = true;
        return this;
    }

    finish(): Database {
        this.database.sql = this.search.finish().sql;
        return this.database;
    }
}

// export default Mysql;

const a = null;
const database = new Database(a);

console.log(database.table('players')
.delete()
.where('id = ?', 100)
.finish().sql);
