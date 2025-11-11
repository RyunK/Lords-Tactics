/**
 * 저장/게시 DATETIME 저장
 **/ 
class LastDatetime{
    static now;

    static init(){
        this.now = new Date();
        return this.now;
    }

    static dateFormating(){
        return this.now.getFullYear()+"-"+("0"+(this.now.getMonth()+1)).slice(-2) + "-" + ("0"+(this.now.getDate())).slice(-2) + " " +  ("0"+(this.now.getHours())).slice(-2) + ":" +  ("0"+(this.now.getMinutes())).slice(-2)  + ":" +  ("0"+(this.now.getSeconds())).slice(-2)
    }
}
