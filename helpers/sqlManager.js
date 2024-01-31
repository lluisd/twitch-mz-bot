const sql = require('mssql')
const config = require('../config')
const Token = require("../models/token");

async function getCloserFutureTrain (origin, destination, type) {
    try {
        this.pool = await sql.connect(config.sql.connectionString)
        const request = this.pool.request()
        const result = await request.query(`SELECT CONVERT(VARCHAR(8),A.departure_time, 108) time , A.stop_name origin_stop, B.stop_name destination_stop , C.start_date, C.end_date, T.service_id, R.route_id  FROM
(SELECT ST.trip_id , S.stop_name, ST.stop_id, ST.stop_sequence, ST.departure_time
from stop_times ST
inner join stops S ON S.stop_id = ST.stop_id 
WHERE 
  S.stop_name LIKE '%${origin}%' and 
  ST.pickup_type = 0 
  
  ) AS A

INNER JOIN

(SELECT ST.trip_id, ST.stop_id, ST.stop_sequence, S.stop_name
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
AND (C.start_date IS NULL OR C.start_date  <= DATEADD(hour, 1, GETDATE()))
and (C.end_date IS NULL OR C.end_date >= DATEADD(hour, 1, GETDATE()))
AND T.service_id NOT IN  (SELECT CD.service_id FROM calendar_dates CD
where CD.date = DATEADD(hour, 1, GETDATE()) )
 AND route_short_name = '${type}'
 AND A.departure_time > CONVERT (time,  DATEADD(hour, 1, GETDATE()))

ORDER BY ABS( DATEDIFF(minute, A.departure_time, CONVERT (time,  DATEADD(hour, 1, GETDATE()))) )`)
        //const result = await sql.query
        console.log(result.recordset[0])
        return result.recordset[0]
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    getCloserFutureTrain
}
