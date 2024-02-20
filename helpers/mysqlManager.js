const mariadb = require('mariadb')
const config = require('../config')
async function getCloserFutureTrain (origin, destination, type) {
    this.pool = mariadb.createPool({
        host: config.mariadb.host,
        user: config.mariadb.user,
        password: config.mariadb.password,
        connectionLimit: 5,
        database: config.mariadb.db,
    })

    let conn
    try {
        conn = await this.pool.getConnection();
        const rows = await conn.query(`SELECT  A.departure_time departure, A.stop_name origin_stop, B.stop_name destination_stop, B.arrival_time arrival FROM
(SELECT ST.trip_id , S.stop_name, ST.stop_id, ST.stop_sequence, ST.departure_time
from stop_times ST
inner join stops S ON S.stop_id = ST.stop_id 
WHERE 
S.stop_name LIKE '%${origin}%' and 
ST.pickup_type = 0 

) AS A

INNER JOIN

(SELECT ST.trip_id, ST.stop_id, ST.stop_sequence, S.stop_name, ST.arrival_time
from stop_times ST 
inner join stops S ON S.stop_id = ST.stop_id 
WHERE 
S.stop_name LIKE '%${destination}%' and 
ST.drop_off_type = 0 
) AS B

ON A.trip_id = B.trip_id  
inner join trips T ON T.trip_id = A.trip_id
inner join routes R ON R.route_id = T.route_id
left join calendar C ON C.service_id = T.service_id

WHERE A.stop_sequence < B.stop_sequence 
AND (C.start_date IS NULL OR C.start_date  <= DATE_ADD(CURDATE(), INTERVAL 1 HOUR ))
and (C.end_date IS NULL OR C.end_date >= DATE_ADD(CURDATE(), INTERVAL 1 HOUR ))
AND T.service_id NOT IN  (SELECT CD.service_id FROM calendar_dates CD
where CD.date = DATE_ADD(CURDATE(), INTERVAL 1 HOUR ) )
AND route_short_name = '${type}'
AND A.departure_time > TIME(DATE_ADD(CURDATE(), INTERVAL 1 HOUR ))

ORDER BY ABS( TIMEDIFF(A.departure_time, TIME(DATE_ADD(CURDATE(), INTERVAL 1 HOUR ))) )
LIMIT 1`)
        if (conn) await conn.end()
        return rows[0]

    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    getCloserFutureTrain
}