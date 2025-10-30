$('.sort-badges div').on('click', function(){
    // 정렬 뱃지 안눌려있던 거 누르면 모두 해제하고 방금 클릭한거만 적용
    if(!$(this).hasClass("filter-selected")){
        $(this).siblings(".filter-selected").children("i").addClass("fa-caret-down").removeClass("fa-caret-up");
        $(this).siblings(".filter-selected").removeClass("filter-selected");
        $(this).addClass("filter-selected");
    }
    // 눌려있다면 오름차순 내림차순 토글
    else {
        $(this).children("i").toggleClass("fa-caret-up").toggleClass("fa-caret-down");
    }

    // 영웅들 다시 표현하는 함수
    hero_filter();
})

$(".typeselecter img").on("click", function(){
    $(this).toggleClass("inactive");

    // 영웅들 다시 표현하는 함수
    hero_filter();
    
})

$(".class-badges div").on("click", function(){
    $(this).toggleClass("filter-selected");

    // 영웅들 다시 표현하는 함수
    hero_filter();
    
}) 

$('.hero-namesearch input').on('propertychange change keyup paste input', function(){
    // 영웅들 다시 표현하는 함수
    hero_filter();
})

$(".havinghero-check .charPublic-checkbox").on("change", function(){
    // 영웅들 다시 표현하는 함수
    hero_filter();
    
})

$('.hero-filter .filterreset').on('click', function(){
    $('.hero-namesearch input').val('');
    $('.charPublic-checkbox').prop('checked', false);
    $(".sort-badges div").eq(0).addClass("filter-selected").children("i").addClass("fa-caret-down").removeClass("fa-caret-up")
    $(".sort-badges div").eq(1).removeClass("filter-selected").children("i").addClass("fa-caret-up").removeClass("fa-caret-down")
    $('.typeselecter img').removeClass('inactive');
    $(".class-badges div").addClass("filter-selected");
    
    // 영웅들 다시 표현하는 함수
    hero_filter();
})



function hero_filter(){
    // console.log("잡힘")
    let result="";
    // console.log(NowFormHeroes.getter);
    let copy_herolist = HavingHeroes.hero_list_getter().slice()
    let hero_list = sortHerolist(copy_herolist);

    let having_hero_only = $('.havinghero-check .charPublic-checkbox').is(':checked')
    let hero_name = $('.hero-namesearch input').val();
    let type_names = $('.typeselecter img:not(.inactive)').map(function(i, e){
            return $(e).attr('src').substr(19).split('.')[0]
    }).get();
    let class_names = $('.class-badges .filter-selected').map(function(i, e){
            return $(e).children('img').attr('src').substr(21).split('.')[0]
    }).get();
    
    let isLoggedin = !$('.nav-box .login').text().includes("로그인");
    for(let i=0; i < hero_list.length; i++){
        if(
        (class_names.includes(hero_list[i]["eng_class"]) )
        && (type_names.includes(hero_list[i]["eng_type"]))
        &&((hero_list[i]["kor_name"]).includes(hero_name) || !hero_name)
        &&(HavingHeroes.getter_id().includes(hero_list[i]["ID"]) || !having_hero_only)
        ){
            result = result + makeHeroHtml(isLoggedin, hero_list[i])
        }
    }
    
    $(".heroes-spread-container").html(result);

    // 현재 편성에 있는 영웅 x표시
    NowFormHeroes.addSelectedEffect();
}

function sortHerolist(hero_list){
    let sort_type = $('.sort-badges .filter-selected').text();
    let sort_order = $('.sort-badges .filter-selected i').hasClass("fa-caret-down"); // true면 내림차순
    let having_heroes = HavingHeroes.getter();
    let having_heroes_id = HavingHeroes.getter_id();

    if(sort_type.includes("등급")){
        hero_list.sort(function(a, b){
            var a_val, b_val
            if(having_heroes_id.indexOf(a["ID"]) < 0) a_val = 0;
            else{
                a_val = parseInt(having_heroes[having_heroes_id.indexOf(a["ID"])].cho)*100 + parseInt(having_heroes[having_heroes_id.indexOf(a["ID"])].lv) + parseInt(having_heroes[having_heroes_id.indexOf(a["ID"])].gak);
            }
            if(having_heroes_id.indexOf(b["ID"]) < 0) b_val = 0;
            else{
                b_val = parseInt(having_heroes[having_heroes_id.indexOf(b["ID"])].cho)*100 + parseInt(having_heroes[having_heroes_id.indexOf(b["ID"])].lv) + parseInt(having_heroes[having_heroes_id.indexOf(b["ID"])].gak);
            }
            
            if(sort_order) return b_val - a_val;
            else return a_val - b_val;
        })
    } else if(!sort_order){
        hero_list.reverse();
    }

    return hero_list;
}

/**
 * @params (Boolean) login 로그인 여부
 * @params (Boolean) have 로그인 여부
 * @params (Array) hero_list 이번에 받은 영웅 정보
 **/
function makeHeroHtml(login, hero){
    let having_heroes = HavingHeroes.getter();
    let having_heroes_id = HavingHeroes.getter_id();
    let gak_num2eng = {0: 'no', 1: 'one', 2: 'two'}
    let have = having_heroes_id.includes(hero["ID"])
    if(login && have){
        return  `<div class="character-list-box select-liner">
                    <div class="character-list" >
                        <img src="/sources/img/characters/${hero.eng_type}_${hero.eng_name}_${hero.eng_class}.png" 
                        alt="" data-id="${hero["ID"]}" data-korname="${hero["kor_name"]}" data-type="${hero.eng_type}"
                        onerror="this.onerror=null; this.src='/sources/img/characters/Chr_Error.png';">
                        <span class="lv_${hero.eng_type} lv">${having_heroes[having_heroes_id.indexOf(hero["ID"])].lv}</span>
                        <span class="${gak_num2eng[having_heroes[having_heroes_id.indexOf(hero["ID"])].gak]}gak gak">${having_heroes[having_heroes_id.indexOf(hero["ID"])].cho}</span>
                    </div>
                </div>`
    } else if(login && !have) {
        return `<div class="character-list-box select-liner">
                    <div class="character-list" >
                        <img src="/sources/img/characters/${hero.eng_type}_${hero.eng_name}_${hero.eng_class}.png" 
                        alt="" data-id="${hero["ID"]}" data-korname="${hero["kor_name"]}" data-type="${hero.eng_type}"
                        onerror="this.onerror=null; this.src='/sources/img/characters/Chr_Error.png';"class="nothave">
                        <span class="lv_${hero.eng_type} lv">0</span>
                        <span class="nogak gak">0</span>
                    </div>
                </div>`
    } else {
        return `<div class="character-list-box select-liner">
                    <div class="character-list" >
                        <img src="/sources/img/characters/${hero.eng_type}_${hero.eng_name}_${hero.eng_class}.png" 
                        alt="" data-id="${hero["ID"]}" data-korname="${hero["kor_name"]}" data-type="${hero.eng_type}"
                        onerror="this.onerror=null; this.src='/sources/img/characters/Chr_Error.png';">
                    </div>
                </div>`
    }
}