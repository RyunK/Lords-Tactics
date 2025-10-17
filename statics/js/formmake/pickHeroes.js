/**
 * 조합 수정하는 기능 개발
 * 캐릭터 늘어진 창에서 img 태그 그대로 가져옴
 */


/**
 * 
 * @param {string} key 
 * @param {string} value 
 */
function addHeroQueryStringParam(key, value){
    const url = new URL(window.location.href);
    url.searchParams.append(key, value);
    window.history.pushState(null, '', url.toString());
}

/**
 * 
 * @param {string} key 
 * @param {string} value 
 */
function removeHeroQueryStringParam(key, value){
    const url = new URL(window.location.href);
    let values = url.searchParams.getAll(key);
    
    console.log("key: " + key)
    console.log("values: " + values)

    url.searchParams.delete(key);
    window.history.pushState(null, '', url.toString());

    let cnt = 0;
    for(let i=0; i<values.length; i++){
        if(values[i] == value && cnt < 1){
            values.splice(i, 1);
            i--;
            cnt++;
        } else {
            addHeroQueryStringParam(key, values[i])
        }
    }
}


/***
 * 칸 클릭하면 다른 칸 선택 지워지고 클릭한 칸 선택됨
 ***/
$(document).on('click',".form_spot", function(e){

    if ($(e.target).hasClass("out")) return;

    let spot = $(this);
    
    $(".form_spot .spot-selected-empty").remove();
    $(".form_spot .spot-selected-full").remove();
    $(".form_spot .out").remove();
    if(spot.find(".empty").length>0){
        spot.prepend("<div class='spot-selected-empty'></div>");
    }else {
        spot.prepend('<img src="../sources/img/out_char.png" class="out">');
        spot.prepend("<div class='spot-selected-full'></div>");                   
    }
})

/***
 * @param {} o 도착지 / spot-selected-full & spot-selected-empty 클래스 지정하는 div. 실제 컨텐츠는 하위의 select-liner 내부에 존재
 * @param {} t 클릭한 캐릭터 / character-list 클래스 div
 * 캐릭터와 함께 붙여놓는 input 태그에는 '(영어 속성) (한글 이름)' 형식으로 담겨있음.
 ***/
function putCharInForm(o, t){
    let deleting_val = o.siblings(".select-liner").children("input").val();
    // console.log("deleting_val = " + deleting_val)
    removeHeroQueryStringParam("hero", deleting_val);

    o.siblings(".select-liner").empty();
    t.find(".char-selected").remove();

    t.children().clone().appendTo(o.siblings(".select-liner"));
                                     
    o.parent().append('<img src="../sources/img/out_char.png" class="out">');
    o.siblings(".select-liner").append(`<input value="${t.children("img").data('id')}" name="hero" type="hidden">`)
    addHeroQueryStringParam("hero", t.children("img").data('id'));
    // console.log("adding_val = " + t.children("img").data('id'))

    o.attr('class', 'spot-selected-full');

    t.prepend("<div class='char-selected'></div>");


}

/***
 * o = 도착지 / 실질 컨텐츠 들어있는 select-liner
 ***/
function removeCharInForm(o){
    let deleting_val = o.children("input").val();
    removeHeroQueryStringParam("hero", deleting_val);
    
    o.children().remove();
    o.append(`<div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
              <input type="hidden" value="0"  name="hero">`);
}

$(document).on('click',".character-list", function(e){
    /***
    * 캐릭터 클릭했을 때 칸 선택되어 있으면 거기로 들어감
    ***/

    // 오류 이미지이면 선택 못함
    if($(this).children('img').attr('src').includes('Error')){
        return;
    }

    //빈 칸인지 이미 누군가 있는지 확인
    if($(".spot-selected-empty").length>0){
        // 선택한 칸이 빈 칸이며, 클릭한 캐릭터가 다른 곳에 있으면 거길 삭제
        let clicked_img = $(this).children('img');
        let existed_img = $(".form_spot img[src$='"+ clicked_img.attr('src') +"']")
        if(existed_img.length>0){
            let ex_parent = existed_img.eq(0).parent();
            // console.log(ex_parent);
            removeCharInForm(ex_parent);
        }

        putCharInForm($(".spot-selected-empty"), $(this));
        return false;

    } else if($(".spot-selected-full").length>0){ // 선택한 칸에 이미 뭔가 있으면
        
        let clicked_img = $(this).children('img');
        let selected_img = $(".spot-selected-full").siblings(".select-liner").children("img");
        let existed_img = $(".form_spot img[src$='"+ clicked_img.attr('src') +"']")

        // 클릭한 캐릭터가 다른 곳에 있고 클릭한 캐릭터와 선택된 칸의 캐릭터가 다르면
        // 원래 이 칸에 있던 이미지를 거기로 보내고 이 칸에 클릭한 캐릭터를 채운다.
        if(existed_img.length>0 && clicked_img.attr('src') !== selected_img.attr('src')){
            let ex_parent = existed_img.parent()
            let deleting_val = ex_parent.children("input").val();
            removeHeroQueryStringParam("hero", deleting_val);
            ex_parent.children().remove();
            selected_img.parent().children().appendTo(ex_parent);

            putCharInForm($(".spot-selected-full"), $(this));
            return false;
        }
        
        // selected에 원래 있던 애를 캐릭터 칸에서 찾아서 selected div 삭제한다.
        let same = $(".character-list img[src$='"+ selected_img.attr('src') +"']").eq(0).parent();
        same.find('.char-selected').remove();

        if(clicked_img.attr('src') !== selected_img.attr('src')){  
            //다른 캐릭터를 눌렀다면 
            putCharInForm($(".spot-selected-full"), $(this));
            return false;
        } else{
            //같은 캐릭터를 눌렀다면 삭제한다.
            removeCharInForm(selected_img.parent())
            $(".spot-selected-full").siblings(".out").remove();
            $(".spot-selected-full").attr('class', 'spot-selected-empty');

        }

        

        return false;
        
    }

    /***
    * 아무 칸도 선택되어있지 않으면 캐릭터 클릭했을 때 이미 들어가있으면 삭제됨
    ***/
    let src = $(this).children().eq(1).attr("src");
    let same = $(".form_spot img[src$='"+ src +"']").eq(0).parent();

    removeCharInForm(same);
    $(this).find(".char-selected").remove();
    


})

/***
 * 마이너스 클릭하면 캐릭터 지워짐
 ***/
$(document).on("click", ".out", function(e){
    e.stopPropagation();
    e.preventDefault();
    
    // 폼 칸에서 캐릭터 이미지를 삭제하고 빈 칸으로 전환
    let this_character = $(this).siblings(".select-liner");
    let character_src = $(this).siblings(".select-liner").children("img").attr('src');
    let chararcter = $(".character-list img[src$='"+ character_src +"']")

    // console.log(chararcter);

    removeCharInForm(this_character);
    $(".spot-selected-full").siblings(".out").remove();                                 

    // 폼 칸의 선택된 효과를 빈 칸으로 전환
    $(".spot-selected-full").attr('class', 'spot-selected-empty');

    // 해당 캐릭터와 동일한 얼굴을 아래에서 찾아서 선택 해제
    chararcter.siblings(".char-selected").remove();
    
    
});