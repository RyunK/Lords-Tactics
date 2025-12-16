const mysql = require('mysql2/promise');

const connection = mysql.createConnection({
    host : process.env.DB_HOST,  
    user : process.env.DB_USER,
    password : process.env.DB_PW,
    database : process.env.DB_NAME,
    port : process.env.DB_PORT,
    enableKeepAlive: true,
});

// connection.connect(function(err) {
//   if (err) {
//     console.error('MySQL 연결실패 :' + err.stack);
//     return;
//   }
//   console.log('MySQL 연결됨');
// });

module.exports = connection