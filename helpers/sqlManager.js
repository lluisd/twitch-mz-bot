const sql = require('mssql')
const config = require('../config')
const Token = require("../models/token");

async function getTrainMDTime (origin, destination) {
    try {
        this.pool = await sql.connect(config.sql.connectionString)
        const request = this.pool.request()
        const result = await request.query(`SELECT  TOP 1 CONVERT(VARCHAR(8),A.departure_time, 108) time , A.stop_name origin_stop, B.stop_name destination_stop  FROM
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
inner join calendar C ON C.service_id = T.service_id

WHERE A.stop_sequence < B.stop_sequence AND 
C.start_date  <= GETDATE()  and
C.end_date >= GETDATE() AND
T.service_id NOT IN  (SELECT CD.service_id FROM calendar_dates CD
where CAST (CD.date AS DATE) =  CAST(GETDATE() AS DATE)) AND
route_short_name = 'MD'
 AND A.departure_time > CONVERT (time, GETDATE())

ORDER BY ABS( DATEDIFF(minute, A.departure_time, CONVERT (time, GETDATE())) )`)
        //const result = await sql.query
        console.log(result.recordset[0])
        return result.recordset[0]
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    getTrainMDTime
}
