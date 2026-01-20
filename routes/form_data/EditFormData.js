import { FormData } from "./FormData.js";
// import pool from "../../database"
const pool = require('../../database.js')

class EditFormData extends FormData{
    #commentsfor;
    #formid;

    constructor(userid, formid) {
        super(userid, members, form_status, form_access, myheroaccess, content_num, writer_memo, lastdatetime)
    }

    async editData(){        
        
           
    }
}

export {EditFormData}