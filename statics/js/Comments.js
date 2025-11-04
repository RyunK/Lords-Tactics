class Comments{
    constructor(){
        this._comments = null;
        this._replys=null;
    }

    set Comments(comments){
        if(!comments) return false;
        this._comments = comments;
    }
    
    set Replys(replys){
        if(!replys) return false;
        this._replys = replys;
    }

    toString(){
        // console.log(this._comments)
        // console.log(this._replys)
        let str = ''
        let cnt = 0;
        for(let i=0; i<this._comments.length; i++){
            var date = new Date(this._comments[i].last_datetime);
            date = date.getFullYear()+"-"+("0"+(date.getMonth()+1)).slice(-2) + "-" + ("0"+(date.getDate())).slice(-2) + " " 
            +  ("0"+(date.getHours())).slice(-2) + ":" +  ("0"+(date.getMinutes())).slice(-2)
            str += `<div class="comment" data-commentid="${this._comments[i].id}">
                        <div class="comment-author bg-basicdark color-white">`
            if(this._comments[i].is_formauthor == 1) str += `<span>작성자</span>`
            if(this._comments[i].nickname.includes("알 수 없음")){
                str += `
                    <span>${this._comments[i].nickname}</span>
                </div>
                <div class="comment-body w-100 d-flex">

                    <p>${this._comments[i].comment_body}</p>
                </div>
                </div>
                `
            } else{
                str += `
                <span class="color-purple">${this._comments[i].nickname}</span>
                    </div>
                    <div class="comment-body w-100 d-flex">

                        <p>${this._comments[i].comment_body}</p>
                    </div>
                    <div class="comment-bottom d-flex">
                        <span class="date">
                            ${date}
                        </span>
                        <span class="reply-btn">답글쓰기</span>
                `
                if(this._comments[i].is_author == 1){
                    str += `<div>
                                <span class="edit">수정</span>
                                <span class="delete color-red me-1">삭제</span>
                            </div>`
                } else {
                    str += `<div >
                                <span class="color-red">신고</span>
                            </div>`
                }
                str += `</div>
                </div>`
            }
            

            while(cnt < this._replys.length && this._replys[cnt].comment_id == this._comments[i].id){
                var date = new Date(this._replys[cnt].last_datetime);
                date = date.getFullYear()+"-"+("0"+(date.getMonth()+1)).slice(-2) + "-" + ("0"+(date.getDate())).slice(-2) + " " 
                +  ("0"+(date.getHours())).slice(-2) + ":" +  ("0"+(date.getMinutes())).slice(-2)
                str += `<div class="reply" data-commentid="${this._replys[cnt].id }">
                    <div class="comment-author bg-basicdark color-white">`
                if(this._replys[cnt].is_formauthor == 1) str += `<span>작성자</span>`;
                if(this._replys[cnt].nickname.includes("알 수 없음")){
                    str += `  <span>${this._replys[cnt].nickname }</span>
                    </div>
                    <div class="comment-body w-100 d-flex align-items-baseline">`
                    if(this._replys[cnt].reply_id ) str += `<span class="me-3 color-purple">@${this._replys[cnt].reply_nickanme }</span>`
                    str += `<p>${this._replys[cnt].reply_body }</p>
                    </div>
                    </div>`
                } else{
                        str += `  <span class="color-purple">${this._replys[cnt].nickname }</span>
                    </div>
                    <div class="comment-body w-100 d-flex align-items-baseline">`
                        if(this._replys[cnt].reply_id) str += `<span class="me-3 color-purple">@${this._replys[cnt].reply_nickanme }</span>`
                        str += `<p>${this._replys[cnt].reply_body }</p>
                    </div>
                    <div class="comment-bottom d-flex">
                        <span class="date">
                            ${date}
                        </span>
                        <span class="reply-btn">답글쓰기</span>`
                        if(this._replys[cnt].is_author == 1){
                            str += `<div>
                                        <span class="edit">수정</span>
                                        <span class="delete color-red me-1">삭제</span>
                                    </div>`
                        } else{
                            str += `<div >
                                        <span class="report color-red">신고</span>
                                    </div>`
                        }
                        str += `</div>
                        </div>`
                        }
                
                cnt += 1;
            }

        }
        return str;
    }
    
}

function commentsReload(comments, replys){
    let comment_container = $(".comment-body-container .comments");
    comment_container.empty();
    let comment_object = new Comments;
    comment_object.Comments = comments;
    comment_object.Replys = replys;
    let comment_html = comment_object.toString();
    comment_container.html(comment_html);

    $(".comment-header .length").text(comments.length + replys.length);
}