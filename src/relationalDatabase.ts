//@types
import {Controller, SelectConfig, InsertConfig, UpdateConfig} from './type';

// 2. 抽象方法继承Controller
export default abstract class RelationalDatabase implements Controller {
    abstract select(tableName: string, config: SelectConfig): Promise<any>;

    abstract delete(tableName: string, where: object): Promise<any>;

    abstract insert(tableName: string, rows: any, config?: InsertConfig): Promise<any>;

    abstract update(tableName: string, row: object, config: UpdateConfig): Promise<any>;

    abstract query(sql: string): Promise<any>;
}
