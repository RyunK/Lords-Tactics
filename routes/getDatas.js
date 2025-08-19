
module.exports = {
   loggedInNickname : function (req, res){
      if(req.user){
         return req.user[0].nickname;
      } else{
         return "";
      }
   }
}
