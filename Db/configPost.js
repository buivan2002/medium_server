const { Client } =require ('pg');


const client = new Client({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'Test',
});

module.exports = client;
