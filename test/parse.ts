const knex = require('knex')({ client: 'mysql' });

console.log(knex.select('title', 'author', 'year').from('books').toString())

console.log(knex.avg('sum_column1').from(function (): void {
	this.sum('column1 as sum_column1').from('t1').groupBy('column1').as('t1')
}).as('ignored_alias').toString())
