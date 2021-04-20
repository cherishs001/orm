import { Orm, getConnection } from '../src/index';
import * as http from 'http';

const o = new Orm('10.26.136.5', 3306, 'root', '123456', 'api_gateway');
const s = o.authenticate('mysql');

(async () => {
    const res = await getConnection('mysql')
        .table('api_gateway.test')
        .select()
        .limit(1)
        .finish()
        .exec();
    console.log(res);

    for (let i = 0; i < 5; i++) {
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

    // process.exit(0);
})()

const server = http.createServer(async (req, res) => {
    console.log(123);
    const r = await s.query(`select sleep(12);`).logs(true).exec();
    console.log(r);
    res.writeHead(200);
    res.end('');
});

server.listen(3000);
