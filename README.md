# @kaishen/orm
It is written in JavaScript. crud for mysql.

## install： 
```js 
npm install @kaishen/orm --save
or
yarn add @kaishen/orm
```

## Use：
```js 
//import
import orm from '@kaishen/orm';

//require
let orm = require('@kaishen/orm');
```

## Config initialization：
```js
// You can initialize the configuration at project startup
const database = new orm({
    host: 'localhost',
    username: 'root',
    password:'123456',
    database: 'test',
    port: 3306,
});
```

### configs
> * host:             host address. (default:'127.0.0.1')
> * user:             user. (default:'root')
> * password:         password.  (default:'root')
> * database:         database.  (default:'test')
> * port:             port.  (default:'3306')

### Simple usage of generating SQL statements.

**select**

```js
database.table('players')
    .select()
    .column('id')
    .column('name')
    .where('id = ?', 100)
    .finish()
    .exec();

select id, name from players where id = 100;
```

**insert**

```js
database.table('players')
    .insert()
    .values({id: '100', name: 'kai'})
    .finish()
    .exec();

insert into players (id, name) values('100', 'kai');
```

**update**

```js
database.table('players')
    .update()
    .set({name: 'kai2'})
    .where('id = ?', 100)
    .finish()
    .exec();

update players set name='kai2' where id = 100;
```

**delet**
 
```js
database.table('players')
    .delete()
    .where('id = ?', 100)
    .finish();

delete from players where id = 100;
```