import { Orm, getConnection } from '../src/index';

(async () => {
    const o = new Orm('10.26.136.5', 3306, 'root', '123456', 'api_gateway');
    o.authenticate('mysql');

    const res = await getConnection('mysql')
        .table('api_gateway.test')
        .logs(true)
        .select()
        .finish()
        .exec();
    console.log(res);

    // 测试事务
    const tran = await getConnection('mysql').beginTransaction();
    const res2 = await tran.table('api_gateway.test')
        .logs(true)
        .insert()
        .values({
            test_day: new Date(),
            nb: `Monthly, subject to Manager"s """""discretion`,
        })
        .finish()
        .exec();

    await tran.commit();

    console.log(res2);

    process.exit(0);
})()
