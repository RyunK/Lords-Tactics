// 필터 및 정렬 ************************************************

// 정렬 후 필터 눌렀을 때 정렬 안 망가지게 해야함

/**
 * 리스트를 전달하면 html로 만들어줌
 * @param {Array} list 필터 혹은 정렬한 리스트
 * @returns {String} 삽입하면 되는 html 요소 문자열
 */
function renderCharacterList(list){
    let ret = "";
    if($('.login').text().includes('로그인')){
        list.forEach(function(v){
            let html_str = `<li class="character-list-box select-liner d-flex justify-content-center" >
                                <div class="character-list" >
                                    <img src="/sources/img/characters/${v.eng_type}_${v.eng_name}_${v.eng_class}.png" 
                                    alt="" data-id="${v["ID"]}" data-korname="${v.kor_name}" data-type="${v.eng_type}"
                                    onerror="this.onerror=null; this.src='/sources/img/characters/Chr_Error.png';">
                                </div>
                            </li>`
            
            ret += html_str;
        });
    } else {
        list.forEach(function(v){
            let html_str = `<li class="character-list-box select-liner d-flex justify-content-center" >
                                <div class="character-list" >
                                    <img src="/sources/img/characters/${v.eng_type}_${v.eng_name}_${v.eng_class}.png" 
                                    alt="" data-id="${v["ID"]}" data-korname="${v.kor_name} data-type="${v.eng_type}"
                                    onerror="this.onerror=null; this.src='/sources/img/characters/Chr_Error.png';">
                                    <span class="lv_${v.eng_type} lv">70</span>
                                    <span class="nogak gak">7</span>
                                </div>
                            </li>`
            
            ret += html_str;
        });
    }

    return ret;
}

/**
 * 영웅 필터링 및 정렬해서 적용까지
 */
function hero_filter(){
    let result="";
    let hero_list = HeroesData.getter_allheroes();
    let having_heroes = HeroesData.getter_having();
    let having_heroes_id = HeroesData.getter_id();
    let gak_num2eng = {0: 'no', 1: 'one', 2: 'two'}
    // let hero_list_html = $('.character-list-box');

    // 이 아래는 복붙만 하고 미구현
    // let having_hero_only = $('.havinghero-check .charPublic-checkbox').is(':checked')
    // let type_names = $('.typeselecter img:not(.inactive)').map(function(i, e){
    //     return $(e).attr('src').substr(19).split('.')[0]
    // }).get();
    // let class_name = $('.hero-class-search > span').eq(0).text();
    // let sort_type = $('.hero-sort-btn').text();

    // if(sort_type.includes("등급순")){
    //     hero_list.sort(function(a, b){
    //         var a_val, b_val
    //         if(having_heroes_id.indexOf(a["ID"]) < 0) a_val = 0;
    //         else{
    //             a_val = parseInt(having_heroes[having_heroes_id.indexOf(a["ID"])].cho)*100 + parseInt(having_heroes[having_heroes_id.indexOf(a["ID"])].lv) + parseInt(having_heroes[having_heroes_id.indexOf(a["ID"])].gak);
    //         }
    //         if(having_heroes_id.indexOf(b["ID"]) < 0) b_val = 0;
    //         else{
    //             b_val = parseInt(having_heroes[having_heroes_id.indexOf(b["ID"])].cho)*100 + parseInt(having_heroes[having_heroes_id.indexOf(b["ID"])].lv) + parseInt(having_heroes[having_heroes_id.indexOf(b["ID"])].gak);
    //         }                
    //         return b_val - a_val;
    //     })
    // }

    // // console.log(having_heroes_id)

    // for(let i=0; i < hero_list.length; i++){
    //     if(
    //     (class_name.includes(hero_list[i]["kor_class"]) || class_name.includes('전체'))
    //     && (type_names.includes(hero_list[i]["eng_type"]))
    //     &&((hero_list[i]["kor_name"]).includes(hero_name) || !hero_name)
    //     &&(having_heroes_id.includes(hero_list[i]["ID"]) || !having_hero_only)
    //     ){
    //         if(having_heroes_id.includes(hero_list[i]["ID"])){ // 보유한 영웅
    //             result = result +
    //             `<li class="character-list-box select-liner d-flex justify-content-center">
    //                 <div class="character-list" >
    //                     <img src="/sources/img/characters/${hero_list[i].eng_type}_${hero_list[i].eng_name}_${hero_list[i].eng_class}.png" 
    //                     alt="" data-id="${hero_list[i]["ID"]}" data-korname="${hero_list[i]["kor_name"]}" data-type="${hero_list[i].eng_type}"
    //                     onerror="this.onerror=null; this.src='/sources/img/characters/Chr_Error.png';">
    //                     <span class="lv_${hero_list[i].eng_type} lv">${having_heroes[having_heroes_id.indexOf(hero_list[i]["ID"])].lv}</span>
    //                     <span class="${gak_num2eng[having_heroes[having_heroes_id.indexOf(hero_list[i]["ID"])].gak]}gak gak">${having_heroes[having_heroes_id.indexOf(hero_list[i]["ID"])].cho}</span>
    //                 </div>
    //             </li>`
    //         } else{ // 보유하지 않은 영웅
    //             result = result +
    //             `<li class="character-list-box select-liner d-flex justify-content-center">
    //                 <div class="character-list" >
    //                     <img src="/sources/img/characters/${hero_list[i].eng_type}_${hero_list[i].eng_name}_${hero_list[i].eng_class}.png" 
    //                     alt="" data-id="${hero_list[i]["ID"]}" data-korname="${hero_list[i]["kor_name"]}" data-type="${hero_list[i].eng_type}"
    //                     onerror="this.onerror=null; this.src='/sources/img/characters/Chr_Error.png';"class="nothave">
    //                     <span class="lv_${hero_list[i].eng_type} lv">0</span>
    //                     <span class="nogak gak">0</span>
    //                 </div>
    //             </li>`
    //         }
            
    //     }

    // }

    // // console.log(result);
    
    // $(".characters-container > .d-flex").html(result);

    // // 보유 영웅 설정 ON 시 체크까지
    // if(!$('.havinghero-blocker').hasClass('invisible')){
    //     HavingHeroChecker.checked_heroes_recheck()    
    // }

    // // 영웅 설정 중이고 해당 영웅 있으면 찾아서 select
    // if(!$('.setting-form form').hasClass('invisible')){
    //     $('.char-selected').remove();
    //     let setting_hero = $('.setting-form form input[name="hero"]').val()
    //     // console.log(setting_hero)
    //     $(`.character-list img[data-id="${setting_hero}"]`).parent().prepend(`<div class='char-selected'></div>`);
    // }
}

/**
 * 현재 정렬된 리스트 상태
 */
class CurrentChr{
    static current_herolist = HeroesData.getter_allheroes();;

    static setter(list){
        CurrentChr.current_herolist = list;
        return CurrentChr.current_herolist;
    }

    static getter(){
        return CurrentChr.current_herolist;
    }

}


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
        filtered_characters = CurrentChr.getter()
    }else{
        filtered_characters = CurrentChr.getter().filter(function(v){
            let rst = 0;
                for(let j=0; j<type.length; j++){
                    if(type[j].includes(v.eng_type)){
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
                    const class_name = v.eng_class
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
    $(".characters-container").append(renderCharacterList(filtered_characters));

}

/**
 *  뱃지들 확인해서 필터 배열 생성 
 **/
function typeBadges2FilterArr() {
    let filter_arr = $('.type-boxes img').map(function(i){
        let src = $(this).attr('src');
        // console.log(src)
        const filename = src.split("/").pop(); // "dark_2.png"
        return filename.split("_")[0];    // "dark"
    }).get();
    
    return filter_arr;
}

function classBadges2FilterArr() {
    let filter_arr = $('.class-boxes img').map(function(i){
        let src = $(this).attr('src');
        // console.log(src)
        const filename = src.split("/").pop(); // "commander.png"
        return filename.split(".")[0];    // "commander"
    }).get();
    
    return filter_arr;
}

/**
 * 클래스&속성 버튼 체크/언체크
 */ 
$(".filter-checkbox").change(function(e){
    let btn = $(this).siblings("div");
    
    // 안에 있는 아이콘
    let token_src = btn.children("img").attr('src'); 

    if(btn.hasClass('filter-class-btn')){

        if($(this).is(":checked")){ // 필터 적용
            // 클래스용 박스에 넣어서
            let html_str = `<div class="checked-filter-box class-box"><img src="${token_src}"></div>`
            // 클래스용 박스 컨테이너에 append
            $('.class-boxes').append(html_str);
            filterByTypeNClass(typeBadges2FilterArr(), classBadges2FilterArr());
        } else{ // 필터 해제
            // 이미지 소스가 동일한 애 찾아서 박스 삭제
            $(`.class-boxes div img[src="${token_src}"]`).parent().remove();
            filterByTypeNClass(typeBadges2FilterArr(), classBadges2FilterArr());
        }
        
    } else if (btn.hasClass('filter-type-btn')){
        if($(this).is(":checked")){ // 필터 적용
            // 타입용 박스에 넣어서
            let html_str = `<div class="checked-filter-box type-box"><img src="${token_src}"></div>`
            // 타입용 박스 컨테이너에 append
            $('.type-boxes').append(html_str);
            
            filterByTypeNClass(typeBadges2FilterArr(), classBadges2FilterArr());
        } else{ // 필터 해제
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
    else if($(this).hasClass('filter-selected') && $(this).children("i").length > 0){

        if($(this).children("i").hasClass("fa-caret-down")){
            // 정렬 필터 두번째 선택 : 값이 낮은것을 위로
            $(this).children("i").removeClass('fa-caret-down');
            $(this).children("i").addClass('fa-caret-up');

            charSortHandler(false, text);
        } else { // 정렬 끄기
            $(this).children("i").removeClass('fa-caret-up');
            $(this).children("i").addClass('fa-caret-down');

            $(this).removeClass('filter-selected');
            $(this).addClass('filter-unselected');
            charSortHandler(true, text);
        }                
    }
    else{
        $(this).removeClass('filter-selected');
        $(this).addClass('filter-unselected');
        charSortHandler(false, text);

    }
});

/**
 * 정렬 핸들러
 */
function charSortHandler(big2small, text){
    if(text.includes("영웅 순")){
        sortByHeroName(big2small);
    }else if(text.includes("등급 순")){
        sortByGrade(big2small);
    }else if(text.includes("보유 영웅")){
        haveHeroToggle();
    }
}

/**
 * 보유 영웅 ON/OFF
 */
function haveHeroToggle(){
    let now_status = $(".have-status").text();

    if(now_status == "ON"){
        $(".have-status").text("OFF");
    } else {
        $(".have-status").text("ON");
    }
}

/**
 * 영웅 이름 순서 정렬 
 * @param {boolean} big2small true : 내림차순 / false : 오름차순
 */
function sortByHeroName(big2small){
    let sorted_list = hero_list.slice();
    if(big2small){ // 가나다 순
        sorted_list = hero_list;
    } else { // 역순 
        sorted_list.sort(function(a, b){
                return b.kor_name.localeCompare(a.kor_name);
            })
    }
    $(".characters-container").html(renderCharacterList(sorted_list));
    CurrentChr.setter(sorted_list);
    filterByTypeNClass(typeBadges2FilterArr(), classBadges2FilterArr());
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