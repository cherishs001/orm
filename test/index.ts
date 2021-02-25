import { Orm, getConnection } from '../src/index';

(async () => {
    const o = new Orm('10.26.136.5', 3306, 'root', '123456', 'api_gateway');
    const s = o.authenticate('mysql');

    const res = await getConnection('mysql')
        .table('api_gateway.test')
        .select()
        .finish()
        .exec();
    console.log(res);

    for (let i = 0; i < 100; i++) {
        await s.table('api_gateway.test')
            .logs(true)
            .select()
            .finish()
            .exec();

        const tran = await getConnection('mysql').beginTransaction();
        await tran.table('api_gateway.test')
            .logs(true)
            .insert()
            .values({
                test_day: new Date(),
                nb: `Monthly, subject to Manager"s """""discretion`,
            })
            .finish()
            .exec();

        await tran.commit();
    }

    process.exit(0);
})()
