// 필터 및 정렬 ************************************************
            
// 원본 캐릭터 데이터
const original_characters = $(".characters-container li").map(function () {
    return {
        img_src: $(this).children('div').children('img').attr('src'),
        lv_class: $(this).children('div').children('.lv').attr('class'),
        lv : $(this).children('div').children('.lv').text(),
        gak_class: $(this).children('div').children('.gak').attr('class'),
        cho: $(this).children('div').children('.gak').text()
    };
}).get()

/**
 * 필터
 * type = ["dark", "fire"] 이런식의 리스트.
 * class_names = ["warrior, striker"]
 */
function filterByTypeNClass(type, class_names){
    // 오리지널 캐릭터 배열에서 필터 받은 것들만 만들어서 html 만들기
    let filtered_characters;

    // 타입 필터
    if(type == "" || type == []){
        filtered_characters = original_characters
    }else{
        filtered_characters = original_characters.filter(function(v){
            let rst = 0;
                for(let j=0; j<type.length; j++){
                    if(v.lv_class.includes(type[j])){
                        rst ++;
                        break;
                    }
                }

            return rst > 0
        });
    }

    // 클래스 필터
    if(class_names == "" || class_names == []){}
    else{
        filtered_characters = filtered_characters.filter(function(v){
            let rst = 0;
                for(let j=0; j<class_names.length; j++){
                    const filename = v.img_src.split("/").pop(); // dark_zhurahan_warrior.png"
                    const class_name = filename.split(".")[0].split("_")[2];    // "warrior"
                    if(class_name == class_names[j]){
                        rst ++;
                        break;
                    }
                }

            return rst > 0
        });
    }

    

    // html 만들어서 append
    $(".characters-container").empty();
    filtered_characters.forEach(function(v){
        let html_str = `<li class="character-list-box select-liner d-flex justify-content-center" >
                            <div class="character-list" >
                                <img src="${v.img_src}">
                                <span class="${v.lv_class}">${v.lv}</span>
                                <span class="${v.gak_class}">${v.cho}</span>
                            </div>
                        </li>`
        
        $(".characters-container").append(html_str);
    });
}

    /**
     *  뱃지들 확인해서 필터 배열 생성 
     **/
function typeBadges2FilterArr() {
    
    // console.log("함수 들어옴")
    let filter_arr = $('.type-boxes img').map(function(i){
        let src = $(this).attr('src');
        // console.log(src)
        const filename = src.split("/").pop(); // "dark_2.png"
        return filename.split("_")[0];    // "dark"
    }).get();

    // console.log("filter_arr : " + filter_arr);
    
    return filter_arr;
}

function classBadges2FilterArr() {
    
    // console.log("함수 들어옴")
    let filter_arr = $('.class-boxes img').map(function(i){
        let src = $(this).attr('src');
        // console.log(src)
        const filename = src.split("/").pop(); // "commander.png"
        return filename.split(".")[0];    // "commander"
    }).get();

    // console.log("filter_arr : " + filter_arr);
    
    return filter_arr;
}

/**
 * 클래스&속성 버튼 체크/언체크
 */ 
$(".filter-checkbox").change(function(e){
    let btn = $(this).siblings("div");
    
    // 안에 있는 아이콘을 
    let token_src = btn.children("img").attr('src'); 
    // console.log('token_src : ' + token_src);

    if(btn.hasClass('filter-class-btn')){

        if($(this).is(":checked")){
            // 클래스용 박스에 넣어서
            let html_str = `<div class="checked-filter-box class-box"><img src="${token_src}"></div>`
            // 클래스용 박스 컨테이너에 append
            $('.class-boxes').append(html_str);
            filterByTypeNClass(typeBadges2FilterArr(), classBadges2FilterArr());
        } else{
            // 이미지 소스가 동일한 애 찾아서 박스 삭제
            $(`.class-boxes div img[src="${token_src}"]`).parent().remove();
            filterByTypeNClass(typeBadges2FilterArr(), classBadges2FilterArr());
        }
        
    } else if (btn.hasClass('filter-type-btn')){
        if($(this).is(":checked")){
            // 타입용 박스에 넣어서
            let html_str = `<div class="checked-filter-box type-box"><img src="${token_src}"></div>`
            // 타입용 박스 컨테이너에 append
            $('.type-boxes').append(html_str);
            
            filterByTypeNClass(typeBadges2FilterArr(), classBadges2FilterArr());
        } else{
            // 이미지 소스가 동일한 애 찾아서 박스 삭제
            $(`.type-boxes div img[src="${token_src}"]`).parent().remove();
            filterByTypeNClass(typeBadges2FilterArr(), classBadges2FilterArr());
        }
    }

    checkExsistCharacters();
});

/**
 * 클래스&속성 토큰 눌렀을 때 삭제
 */
$(document).on('click', '.checked-filter-box', function(e){
    let src = $(this).children('img').attr('src');

    // 동일한 이미지 찾아서 언체크
    $(`.char-filter-menu img[src="${src}"]`).parent().siblings('input').prop('checked', false);
    
    // 토큰 삭제
    $(this).remove();
    filterByTypeNClass(typeBadges2FilterArr(), classBadges2FilterArr());
    checkExsistCharacters();

});

/**
 * 영웅 필터 토글
 */ 
function filterToggle(){
    const menu =  $(".char-filter-menu");
    const top_btn = $(".char-filter-btn");
    const now_i = top_btn.children("i");

    // menu.slideToggle(150);

    if(now_i.attr('class') == "fa-solid fa-angle-down"){
        now_i.attr('class', "fa-solid fa-angle-up");
        menu.attr('style', 'visibility: visible;')
    } else {
        now_i.attr('class', "fa-solid fa-angle-down");
        menu.attr('style', 'visibility: hidden;')
    }
}

$(".char-filter-btn").on('click', function(e){
    filterToggle()
})


/**
 * 영웅 필터 - 정렬 토글
 */
$(".filter-sort-btn").on('click', function(e){
    const text = $(this).text();

    if($(this).hasClass('filter-unselected')){
        // 정렬 필터를 처음 선택함
        $(this).removeClass('filter-unselected');
        $(this).addClass('filter-selected');

        charSortHandler(true, text);
        // console.log(text);
    }
    else if($(this).hasClass('filter-selected')){

        if($(this).children("i").hasClass("fa-caret-down")){
            // 정렬 필터 두번째 선택 : 값이 낮은것을 위로
            $(this).children("i").removeClass('fa-caret-down');
            $(this).children("i").addClass('fa-caret-up');

            charSortHandler(false, text);
        } else {
            $(this).children("i").removeClass('fa-caret-up');
            $(this).children("i").addClass('fa-caret-down');

            $(this).removeClass('filter-selected');
            $(this).addClass('filter-unselected');
        }                
    }
    else{
        $(this).removeClass('filter-selected');
        $(this).addClass('filter-unselected');
    }
});

/**
 * 정렬 핸들러
 */
function charSortHandler(big2small, text){
    if(text == "초월 순"){
        sortByMaxLevel(big2small);
    }else if(text == "각성 순"){
        sortByGaksung(big2small);
    }else if(text == "보유 영웅ON"){

    }
}


/**
 * 초월 순 
 */
function sortByMaxLevel(big2small){
    if(big2small){ // 초월이 높은 게 위로
        $(".characters-container").html(
            $(".characters-container li").sort(function(a, b){
                return Number($(b).children('div').children('.gak').text()) - Number($(a).children('div').children('.gak').text())
            })
        )
    }else{
        $(".characters-container").html(
            $(".characters-container li").sort(function(a, b){
                return Number($(a).children('div').children('.gak').text()) - Number($(b).children('div').children('.gak').text())
            })
        )
    }
}

/**
 * 각성 순 
 */
function sortByGaksung(big2small){
    if(big2small){ // 각성이 높은 게 위로
        $(".characters-container").html(
            $(".characters-container li").sort(function(a, b){
                return gak2num($(b).children('div').children('.gak').attr('class'))-gak2num($(a).children('div').children('.gak').attr('class'))
            })
        )
    }else{
        $(".characters-container").html(
            $(".characters-container li").sort(function(a, b){
            return gak2num($(a).children('div').children('.gak').attr('class'))-gak2num($(b).children('div').children('.gak').attr('class'))
            })
        )
    }
}

function gak2num(class_names){
    const gak_to_num = {
        "no" : 0,
        "one" : 1,
        "two" : 2,
    }

    class_names = class_names.replaceAll(/[gak ]/g, '');

    class_names = gak_to_num[class_names];
    // console.log(class_names);
    return class_names;
}


/**
 * 편성 칸에 있는 영웅들 찾아서 체크 안돼있으면 체크해줌
 */
function checkExsistCharacters(){
    let imgs = $(".form_spot .select-liner img")

    if(imgs.length>0){
        for(let i=0; i<imgs.length; i++){
            let src = imgs.eq(i).attr('src');
            // console.log("src = " + src);
            let char_img = $(`.character-list img[src="${src}"]`);
            if(char_img.siblings(".char-selected").length <= 0){
                // console.log("선택됨");
                char_img.parent().prepend(`<div class='char-selected'></div>`);
            }
        }
    }
}