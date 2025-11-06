
module.exports = {
   loggedInNickname : function (req, res){
      if(req.user){
         return req.user[0].nickname;
      } else{
         return "";
      }
   },

   getContentsName :  async function (req, res, connection){
      var sql = `SELECT * FROM CONTENTS_NAME
                ORDER BY KOR_NAME`;
      var [contents_list, fields] = await (await connection).execute(sql);
      return contents_list;
   },
   
   getHeroList : async function (req, res, connection){
      var sql = `SELECT LH.ID, types.ENG_NAME AS 'eng_type', types.KOR_NAME AS 'kor_type', 
                names.ENG_NAME AS 'eng_name', names.KOR_NAME AS 'kor_name', 
                classes.ENG_NAME AS 'eng_class', classes.KOR_NAME AS 'kor_class'  FROM LAUNCHED_HEROES AS LH
                INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
                INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
                INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
                WHERE NOT LH.ID = '0'
                ORDER BY names.KOR_NAME, types.KOR_NAME
                `;
      var [hero_list, fields] = await (await connection).execute(sql);
      // console.log(hero_list)
      return hero_list;
   },

   get_filtered_herolist: async function (req, res, connection){
      let filtered_heroes_list = req.query.hero? req.query.hero : [];
      let filtered_heroes_list_forrender = []

      if(!Array.isArray(filtered_heroes_list)){
         filtered_heroes_list = [filtered_heroes_list];
      }

      for(let i=0; i<filtered_heroes_list.length; i++){
         var sql = `SELECT LH.ID, types.ENG_NAME AS 'eng_type', types.KOR_NAME AS 'kor_type', 
                  names.ENG_NAME AS 'eng_name', names.KOR_NAME AS 'kor_name', 
                  classes.ENG_NAME AS 'eng_class', classes.KOR_NAME AS 'kor_class'  FROM LAUNCHED_HEROES AS LH
                  INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
                  INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
                  INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
                  WHERE LH.ID = ?`;
         var [filtered_hero, fields] = await (await connection).execute(sql, [filtered_heroes_list[i]]);

         filtered_heroes_list_forrender.push(filtered_hero[0]);
      }

      // console.log(filtered_heroes_list, filtered_heroes_list_forrender);

      return [filtered_heroes_list, filtered_heroes_list_forrender];
   },

   getFormlistNMembers: async function (req, res, where, order, q_list, connection){
      let rn = 1;
      if(req.query.hero && Array.isArray(req.query.hero)) rn = req.query.hero.length;
      // console.log(rn)
      let user_id;
      if (req.isAuthenticated()){
         user_id = req.user[0].id;
      }else {
         user_id = -1;
      }

      var sql = `SELECT T.*, ROW_NUMBER() OVER(${order}) AS ORDER_NUM FROM (
                SELECT HF.ID, HF.WRITER_MEMO, HF.LAST_DATETIME, HF.VIEW, HF.SAVED_CNT, hf.USER_ID = ${user_id} AS IS_WRITER,
                FM.HERO_ID, CN.KOR_NAME as CONTENT_NAME, FS.STATUS_NAME, FAS.ENG_NAME AS ACCESS, USER.NICKNAME,
                    ROW_NUMBER() OVER (
                        PARTITION BY HF.id 
                        ORDER BY HF.last_datetime DESC
                    ) AS rn
                FROM HERO_FORMS HF
                INNER JOIN FORM_MEMBERS FM ON HF.ID = fM.FORM_ID
                INNER JOIN CONTENTS_NAME CN ON HF.CONTENTS_ID = CN.ID
                INNER JOIN FORM_STATUS FS ON HF.FORM_STATUS_ID = FS.ID
                INNER JOIN USER ON HF.USER_ID = USER.ID
                INNER JOIN FORM_ACCESS_STATUS FAS ON HF.FORM_ACCESS_STATUS_ID = FAS.ID 
                WHERE ${where}
            ) AS T
            WHERE T.rn = ${rn}
            ${order} `;
      
      // console.log(sql);
      var [form_list, fields] = await (await connection).execute(sql, q_list );

      var form_ids = form_list.map(function(e){
         return e.ID;
      })
      form_ids = form_ids.join();
      // 미리보기를 위한 form_hero와 launched_hero inner join

      var members
      if(form_ids == ''){
         members = []
      }else{
         var sql = `SELECT form_id, types.ENG_NAME AS type, names.ENG_NAME AS name, hc.ENG_NAME AS class  FROM FORM_MEMBERS FM
               INNER JOIN LAUNCHED_HEROES LH ON FM.HERO_ID = lh.ID 
               INNER JOIN HERO_CLASSES HC ON lh.CLASS_ID = hc.IDX 
               INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
               INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
               WHERE form_id IN (${form_ids})
               ORDER BY form_id;`;
         [members, fields] = await (await connection).execute(sql);
      }

      return [form_list, members];
   },

   formOrderGetter: function(req, res){
      let order = ''
      if(!req.query.sort || req.query.sort =='saved_cnt'){
         order += 'ORDER BY SAVED_CNT DESC'
      } else if(req.query.sort =='view'){
         order += 'ORDER BY VIEW DESC'
      } else if(req.query.sort == 'new'){
         order += 'ORDER BY LAST_DATETIME DESC'
      }

      return order;
   },

   /**
    * 편성 자세히보기에서 편성 구성에 필요한 데이터들
    * @param {*} req 
    * @param {*} res 
    */
   getFormInfoNMembers: async function(req, res, connection){
      
      // id로 inner join 싹 해서 form검색
      var sql = `SELECT HF.ID, HF.WRITER_MEMO, HF.LAST_DATETIME, HF.VIEW, HF.SAVED_CNT, hf.USER_ID = ? AS IS_WRITER, HF.MYHERO_ACCESS, HF.FORM_ACCESS_STATUS_ID,
               CN.KOR_NAME as CONTENT_NAME  ,FS.STATUS_NAME, FAS.ENG_NAME AS ACCESS ,USER.NICKNAME FROM HERO_FORMS HF
               INNER JOIN CONTENTS_NAME CN ON HF.CONTENTS_ID = CN.ID
               INNER JOIN FORM_STATUS FS ON HF.FORM_STATUS_ID = FS.ID
               INNER JOIN USER ON HF.USER_ID = USER.ID
               INNER JOIN FORM_ACCESS_STATUS FAS ON HF.FORM_ACCESS_STATUS_ID = FAS.ID 
               WHERE HF.ID = ?;`
      var [form_info ,fields] = await (await connection).execute(sql, [req.isAuthenticated()?req.user[0].id:-1 , req.params.id]);

      // 편성 멤버 조회
      var sql = `SELECT FM.HERO_LV, FM.HERO_CHO, FM.HERO_GAK, TYPES.ENG_NAME AS TYPE, NAMES.ENG_NAME AS NAME, classes.ENG_NAME AS CLASS  FROM FORM_MEMBERS FM 
               INNER JOIN LAUNCHED_HEROES LH  ON FM.HERO_ID = LH.ID 
               INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
               INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
               INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
               WHERE FM.FORM_ID = ?;`
      var [members ,fields] = await (await connection).execute(sql, [req.params.id]);

      return [form_info, members];
   },

   /**
    * form_id를 이용해서 댓글 및 답글들을 모두 select해서 반환
    * @param {*} req 
    * @param {*} res 
    * @param {*} connection 
    * @param {int} form_id 
    * @returns 
    */
   getCommentsNReplys: async function(req, res, connection, form_id){
      // 게시글 id로 comment 및 reply 검색
      var sql = `SELECT FC.id id, fc.help_form_id , fc.comment_body, fc.last_datetime, (U.ID = ?) AS is_author, 
               U.nickname, (U.ID = U2.ID) AS is_formauthor FROM FORM_COMMENTS FC 
               INNER JOIN user U ON U.ID = FC.AUTHOR_ID 
               INNER JOIN HERO_FORMS HF ON HF.ID = fc.FORM_ID
               INNER JOIN user U2 ON u2.id = hf.USER_ID 
               WHERE FC.FORM_ID = ?
               ORDER BY fc.id asc`
      var [comments, fields] = await (await connection).execute(sql,  [req.isAuthenticated()?req.user[0].id:-1, form_id]);

      var sql = `SELECT FR.id id, FR.comment_id, FR.reply_id , fc.help_form_id , FR.reply_body, FR.last_datetime, U.nickname, 
            (U.ID = ?) AS is_author ,U2.NICKNAME AS reply_nickanme , (U.ID = U3.ID) AS is_formauthor
            FROM FORM_REPLYS FR 
            INNER JOIN user U ON U.ID = FR.AUTHOR_ID
            INNER JOIN FORM_COMMENTS FC ON FC.ID = FR.COMMENT_ID 
            INNER JOIN HERO_FORMS HF ON HF.ID = fc.FORM_ID
            INNER JOIN user U3 ON u3.id = hf.USER_ID 
            LEFT JOIN FORM_REPLYS FR2 ON FR.REPLY_ID = fr2.ID 
            LEFT JOIN user U2 ON fr2.AUTHOR_ID = U2.ID  
            WHERE FC.FORM_ID = ? 
            ORDER BY comment_id ASC , FR.id ASC`
      var [replys, fields] = await (await connection).execute(sql,  [ req.isAuthenticated()?req.user[0].id:-1, form_id]);

      var sql = `SELECT * from(
            SELECT FC.id id, fc.help_form_id,
            FM.HERO_LV, FM.HERO_CHO, FM.HERO_GAK, TYPES.ENG_NAME AS TYPE, NAMES.ENG_NAME AS NAME, classes.ENG_NAME AS CLASS, 
            row_number() over(PARTITION BY fc.HELP_FORM_ID ORDER BY fc.id ASC) AS rn
            FROM FORM_COMMENTS FC
            INNER JOIN FORM_MEMBERS FM ON fm.FORM_ID = fc.HELP_FORM_ID 
            INNER JOIN LAUNCHED_HEROES LH  ON FM.HERO_ID = LH.ID 
            INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
            INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
            INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
            WHERE FC.FORM_ID = ?
            ) as datas
            WHERE rn <= 5;`
      var [help_members, fields] = await (await connection).execute(sql,  [form_id]);


      return [comments, replys, help_members];
   }
}
