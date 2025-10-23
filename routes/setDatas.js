
const connection = require('../database.js')


module.exports = {
   heroSettingNormalSave :  async(req, res) =>{
        var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?;`;
        var [having_heroes, fields] = await (await connection).execute(sql, [req.user[0].id, req.body.hero]);
        
        if(!parseInt(req.body.lv) || !parseInt(req.body.cho) || !parseInt(req.body.gak) || !parseInt(req.body.hero)){
            throw new TypeError("숫자가 아닌 데이터는 저장할 수 없습니다.")
        }

        if(having_heroes.length > 0){
            var sql = `UPDATE HERO_SETTINGS
                        SET LV = ?, CHO = ?, gak = ?
                        WHERE USER_ID = ? AND HERO_ID = ?;`;
            var [result, fields] = await (await connection).execute(sql, [req.body.lv, req.body.cho, req.body.gak, req.user[0].id, req.body.hero]);
            // console.log(result);
        } else {
            var sql = `INSERT INTO HERO_SETTINGS (USER_ID, HERO_ID, LV, CHO, GAK)
                        VALUES (?, ?, ?, ?, ?);`;
            var [result, fields] = await (await connection).execute(sql, [req.user[0].id, req.body.hero, req.body.lv, req.body.cho, req.body.gak]);
        }
   },

   heroSettingAllSave: async(req, res) =>{
        var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
        var [having_heroes, fields] = await (await connection).execute(sql, [req.user[0].id]);
            // console.log(having_heroes);
        
        if(!parseInt(req.body.lv) || !parseInt(req.body.cho) || !parseInt(req.body.gak)){
            throw new TypeError("숫자가 아닌 데이터는 저장할 수 없습니다.")
        }
        
        if(having_heroes.length > 0){
            var sql = `UPDATE HERO_SETTINGS
                        SET LV = ?, CHO = ?, gak = ?
                        WHERE USER_ID = ?;`;
            var [result, fields] = await (await connection).execute(sql, [req.body.lv, req.body.cho, req.body.gak, req.user[0].id]);
            // console.log(result);
        } else {
            var sql = `INSERT INTO HERO_SETTINGS (USER_ID, HERO_ID, LV, CHO, GAK)
                        VALUES (?, ?, ?, ?, ?);`;
            var [result, fields] = await (await connection).execute(sql, [req.user[0].id, req.body.hero, req.body.lv, req.body.cho, req.body.gak]);
        }
   },
}