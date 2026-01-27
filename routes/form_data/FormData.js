// import pool from "../../database.js"
const pool = require('../../database.js')

class FormData{
    #formid = 0;
    #userid = 0;
    #members = [];
    #formstatus = 0;
    #formaccess = 0;
    #myheroaccess = true;
    #contentnum = 0;
    #writermemo = "";
    #lastdatetime;

    constructor() {
        
    }

    async setNewForm(userid, members, form_status, form_access, myheroaccess, content_num, writer_memo, lastdatetime, formid = 0){
        this.userid = userid;
        this.members = members;
        await this.setformstatus(form_status);
        await this.setformaccess(form_access);
        this.myheroaccess = myheroaccess;
        await this.setcontentnum(content_num);
        this.writermemo = writer_memo;
        this.lastdatetime = lastdatetime;
        this.formid = formid;
    }

    /**
     * 유저 데이터에서 멤버 성장 데이터 읽기
     * @param {Integer} i 몇 번째 멤버인지 지정
     */
    async getMemberData(i) {
        var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
        var [hero_info, fields] = await  pool.execute(sql, [this.userid, this.members[i]]);
        let lv, cho, gak;
        // console.log(hero_info + typeof(hero_info))
        lv = hero_info.length > 0 ? hero_info[0].lv : 0;
        cho = hero_info.length > 0  ? hero_info[0].cho : 5;
        gak = hero_info.length > 0  ? hero_info[0].gak : 0;

        return {lv: lv, cho: cho, gak: gak};
    }

    async getCommentsfor(){
        var sql = `select * from hero_forms where id = ?`
        var [result, fields] = await pool.execute(sql, [this.formid]);
        
        return result[0].comments_for_id;
    }

    // formsataus str2num
    async formstatusStr2num(informstatus){
        if(Number.isInteger(informstatus)) return informstatus;
        else if (!isNaN(Number(informstatus))) return Number(informstatus);
        else if(typeof(informstatus) != 'string'){
            throw new Error("formstatus가 문자열이 아닙니다.");
        }

        var sql = `SELECT * FROM FORM_STATUS
                      WHERE STATUS_NAME = ?`;
        var [form_status, fields] = await  pool.execute(sql, [informstatus]);

        if(form_status.length <= 0) throw new Error("일치하는 formstatus가 존재하지 않습니다.")
        return form_status[0].id
    }

    // formstatus num2str
    async formstatusNum2str(informstatus){
        if (isNaN(Number(informstatus))) throw new Error("formstatus가 숫자가 아닙니다.");

        var sql = `SELECT * FROM FORM_STATUS
                      WHERE ID = ?`;
        var [form_status, fields] = await  pool.execute(sql, [informstatus]);

        if(form_status.length <= 0) throw new Error("일치하는 formstatus가 존재하지 않습니다.")
        return form_status[0].status_name
    }

    // formaccess str2num
    async formaccessStr2num(informaccess){
        if(Number.isInteger(informaccess)) return informaccess;
        else if (!isNaN(Number(informaccess))) return Number(informaccess);
        else if(typeof(informaccess) != 'string'){
            throw new Error("formaccess가 문자열이 아닙니다.");
        }

        let lang;
        if(/[a-zA-z]/.test(informaccess)) lang = "ENG_NAME";
        else lang = "KOR_NAME"

        var sql = `SELECT * FROM FORM_ACCESS_STATUS
                      WHERE ${lang} = ?`;
        var [form_access_status, fields] = await  pool.execute(sql, [informaccess]);

        if(form_access_status.length <= 0) throw new Error("일치하는 formaccess가 존재하지 않습니다.")
        return form_access_status[0].id
    }

    // formaccess num2str
    async formaccessNum2str(informaccess){
        if (isNaN(Number(informaccess))) throw new Error("informaccess가 숫자가 아닙니다.");

        var sql = `SELECT * FROM FORM_ACCESS_STATUS
                      WHERE ID = ?`;
        var [form_access_status, fields] = await  pool.execute(sql, [informaccess]);

        if(form_access_status.length <= 0) throw new Error("일치하는 formstatus가 존재하지 않습니다.")
        return {
            eng_name : form_access_status[0].eng_name,
            kor_name : form_access_status[0].kor_name,
        }
    }

    // contentnum str2num
    async contentnumStr2num(incontent){
        if(Number.isInteger(incontent)) return incontent;
        else if (!isNaN(Number(incontent))) return Number(incontent);
        else if(typeof(incontent) != 'string'){
            throw new Error("content가 문자열이 아닙니다.");
        }

        let lang;
        if(/[a-zA-z]/.test(incontent)) lang = "ENG_NAME";
        else lang = "KOR_NAME"

        var sql = `SELECT * FROM CONTENTS_NAME
                      WHERE ${lang} = ?`;
        var [content, fields] = await  pool.execute(sql, [incontent.trim()]);

        if(content.length <= 0) throw new Error("일치하는 content가 존재하지 않습니다.")
        return content[0].id
    }

    // contentnum num2str
    async contentNum2str(incontent){
        if (isNaN(Number(incontent))) throw new Error("content가 숫자가 아닙니다.");

        var sql = `SELECT * FROM CONTENTS_NAME
                      WHERE ID = ?`;
        var [content, fields] = await  pool.execute(sql, [incontent]);

        if(content.length <= 0) throw new Error("일치하는 content가 존재하지 않습니다.");

        return {
            eng_name : content[0].eng_name,
            kor_name : content[0].kor_name,
        }
    }

    get formid() {
        return this.#formid;
    }
    set formid(params) {
        this.#formid = params;
    }

    get userid() {
        return this.#userid;
    }
    set userid(params) {
        this.#userid = params;
    }

    get members() {
        return this.#members;
    }
    set members(inmembers) {
        this.#members = inmembers;
    }

    get formstatus() {
        return this.#formstatus;
    }
    async setformstatus(informstatus) {
        this.#formstatus = await this.formstatusStr2num(informstatus);
    }

    get formaccess() {
        return this.#formaccess;
    }
    async setformaccess(informaccess) {
        this.#formaccess = await this.formaccessStr2num(informaccess);
    }

    get myheroaccess() {
        return this.#myheroaccess;
    }
    set myheroaccess(params) {
        this.#myheroaccess = params;
    }

    get contentnum() {
        return this.#contentnum;
    }
    async setcontentnum(incontentnum) {
        this.#contentnum = await this.contentnumStr2num(incontentnum);
    }

    get writermemo() {
        return this.#writermemo;
    }
    set writermemo(inwritermemo) {
        this.#writermemo = inwritermemo;
    }  

    get lastdatetime() {
        return this.#lastdatetime;
    }
    set lastdatetime(params) {
        this.#lastdatetime = params;
    }
    
}

module.exports = {FormData}
// export {FormData}