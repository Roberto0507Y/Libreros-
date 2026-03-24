import mysql from 'mysql2'
import dotenv from 'dotenv'

dotenv.config(); 

const mysql = mysql(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,

    }
);

mysql.authenticaticate()
    .then(() => console.log('Conexion establecida'))
    .catch(err => console.error('Error al conetar'))

export default mysql;
