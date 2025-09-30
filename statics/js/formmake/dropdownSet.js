/**
 * 드롭다운 세팅에 대한 코드
 */

const originalButtons_formations = $(".share-or-ask button").map(function () {

    let text = $(this).text().replace(/\u00A0 /g, '');

    return {
    text: text,
    class_names: $(this).attr('class')
    };
}).get();

let current_selection_formation = "편성 저장";

/**
 * 편성 상태 드롭다운 바꾸기
 **/
$(".share-or-ask").on('click', ".share-or-ask-btn" , function(e){
    const menu =  $(".share-or-ask-menu");
    const top_btn = menu.siblings("button");
    const now_class = $(this).attr('class');
    const data_input = $("input[name='form_status']")

    // console.log(originalButtons_formations)        

    if(now_class != top_btn.attr('class')){

        current_selection_formation = $(this).text();

        top_btn.attr('class', now_class);
        top_btn.children("p").html("&nbsp; " + $(this).text());
        data_input.val($(this).data("engname"));
        renderFormStatMunu();
        
    }

    formStatToggle();
});

function renderFormStatMunu(){
    $(".share-or-ask-menu").empty();
    originalButtons_formations.forEach(item => {
        // console.log("item.text : " + item.text)
        // console.log("current_selection : " + current_selection_formation)
        if (item.text != current_selection_formation) {
            $(".share-or-ask-menu").append(`<button class="${item.class_names}">${item.text}</button>`);
        }
    });
}

/**
 * 드롭다운 토글 함수
 **/
function formStatToggle(){
    const menu =  $(".share-or-ask-menu");
    const top_btn = menu.siblings("button");
    const now_i = top_btn.children("i");
    const now_class = $(this).attr('class');

    menu.slideToggle(150);

    if(now_i.attr('class') == "fa-solid fa-angle-down"){
        now_i.attr('class', "fa-solid fa-angle-up");
    } else {
        now_i.attr('class', "fa-solid fa-angle-down");
    }
}



/** 컨텐츠 이름 드롭다운*******************************************************************/

/**
 * 컨텐츠 이름 드롭다운 바꾸기
 **/
$(".content-name").on('click', ".content-name-btn" , function(e){
    const menu =  $(".content-name-menu");
    const top_btn = menu.siblings("button");
    const data_input = $("input[name='content_name']")
      

    if($(this).text() != top_btn.text()){

        top_btn.children("p").html("&nbsp; " + $(this).text())
        data_input.val($(this).data("engname"));
        
        switch($(this).text()){
            case "스토리" :
            case "아레나" :
            case "침묵의 해협" :
            case "오벨리스크" :
                turnFormto5();
                break;
            case "망각의 빙하" :
                turnFormto7()
                break;
            case "성운 쟁탈전" :
            case "재앙의 경계" :
            case "시간의 균열" :
                turnFormto10();
                break;
        }
    }

    contentNameToggle();
});


/**
 * 드롭다운 토글 함수
 **/
function contentNameToggle(){
    const menu =  $(".content-name-menu");
    const top_btn = menu.siblings("button");
    const now_i = top_btn.children("i");
    // const now_class = $(this).attr('class');

    menu.slideToggle(150);

    if(now_i.attr('class') == "fa-solid fa-angle-down"){
        now_i.attr('class', "fa-solid fa-angle-up");
    } else {
        now_i.attr('class', "fa-solid fa-angle-down");
    }
}


function turnFormto10(){
    const container = $(".form-container")

    if(container.hasClass('width-10')){
        return;
    }  else if(container.hasClass('width-7')){
        $(".char-selected").remove();
        container.empty();
        for(let i=0; i<5; i++){
        container.append(`<div class="character-5 form_spot">
                            <div class="select-liner ">
                                <div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                                <input value="" disabled name="hero" type="hidden"> 
                            </div>
                            </div>`)
        }
    } else {

    }
    container.prepend(`<div class="party-name">첫 번째 파티</div>`);
    container.append(`<div class="party-name">두 번째 파티</div>`);

    for(let i=0; i<5; i++){
        container.append(`<div class="character-5 form_spot">
                            <div class="select-liner ">
                                <div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                                <input value="" disabled name="hero" type="hidden"> 
                            </div>
                            </div>`)
    }

    container.removeClass('width-5');
    container.removeClass('width-7');
    container.addClass('width-10');

    const form_spot = $(".form_spot");
    form_spot.removeClass('character-5');
    form_spot.removeClass('character-7');
    form_spot.addClass('character-10');

    
}

function turnFormto5(){
    const container = $(".form-container")

    if(container.hasClass('width-5')){
        return;
    } else if(container.hasClass('width-7')){
        $(".char-selected").remove();
        container.empty();
        for(let i=0; i<5; i++){
        container.append(`<div class="character-5 form_spot">
                            <div class="select-liner ">
                                <div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                            </div>
                            </div>`)
        }
    } else {
        $(".party-name").remove();
        for(let i=0; i<5; i++){
            if($(".character-10").eq(9-i).find('.empty').length <= 0){
                let src = $(".character-10").eq(9-i).find('img').attr('src');
                $(`.character-list img[src="${src}"]`).siblings('.char-selected').remove();
            }   
            $(".character-10").eq(9-i).remove();
        }

        const form_spot = $(".form_spot");
        form_spot.removeClass('character-10');
        form_spot.addClass('character-5');
    }


    container.removeClass('width-10');
    container.removeClass('width-7');
    container.addClass('width-5');

    

    
}

function turnFormto7(){
    const container = $(".form-container")

    if(container.hasClass('width-7')){
        return;
    }
    
    $(".char-selected").remove();
    
    container.empty();
    for(let i=0; i<3; i++){
        container.append(`<div class="character-7 form_spot">
                            <div class="select-liner ">
                                <div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                                <input value="" disabled name="hero" type="hidden"> 
                            </div>
                            </div>`)
    }
    container.append(`<div class="change-line"></div>`)
    for(let i=0; i<4; i++){
        container.append(`<div class="character-7 form_spot">
                            <div class="select-liner ">
                                <div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                                <input value="" disabled name="hero" type="hidden"> 
                            </div>
                            </div>`)
    }

    container.removeClass('width-10');
    container.removeClass('width-5');
    container.addClass('width-7');

    const form_spot = $(".form_spot");
    form_spot.removeClass('character-10');
    form_spot.removeClass('character-5');
    form_spot.addClass('character-7');

    
}