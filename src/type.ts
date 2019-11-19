interface SelectConfig {
    where?: object,
    columns?: Array<string>,
    orders?: Array<Array<string>>,
    limit?: number,
    offset?: number
}

interface InsertConfig {
    columns?: Array<string>,
}

interface UpdateConfig {
    columns?: Array<string>,
    where?: object
}

interface Controller {
    select(tableName: string, config: SelectConfig): Promise<any>;
    update(tableName: string, row: object, config: UpdateConfig): Promise<any>;
    delete(tableName: string, where: object): Promise<any>;
    insert(tableName: string, rows: any, config?: InsertConfig): Promise<any>;
    query(sql: string): Promise<any>;
}

interface DatabaseConfig {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
    type: string,
}

export {
    SelectConfig,
    InsertConfig,
    UpdateConfig,
    Controller,
    DatabaseConfig,
};

