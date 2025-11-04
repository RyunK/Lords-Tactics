/**
 * 편성에서 자리 선택 후 밑에 있는 영웅 클릭하면 그 자리에 들어감.
 * = 영웅 클릭했을 때 선택되어 있는 자리로 들어감
 **/
$(document).on('click', ".character-list-box", function(e){
    let hero_id = $(this).children('.character-list').children('img').data('id');
    if(!hero_id) return;
    // console.log(typeof(hero_id))

    // 누른 영웅이 현재 편성에 들어있고 현재 선택한 자리에 아무도 없으면 옮기기
    if(NowFormHeroes.getter().includes(hero_id) && $(".spot-selected-empty").length > 0){
        NowFormHeroes.removeByHeroId(hero_id);
        NowFormHeroes.oneHeroSet(NowFormHeroes.indexOfFormSpot(), hero_id);
        NowFormHeroes.addHeroesInForm();
    }
    // 누른 영웅이 현재 편성에 들어있고 현재 선택한 자리에 누군가 있으며 스스로가 아니면 자리 바꾸기
    else if(NowFormHeroes.getter().includes(hero_id) && $(".spot-selected-full").length > 0 && NowFormHeroes.getter()[NowFormHeroes.indexOfFormSpot()] != hero_id){
        let hero_idx = NowFormHeroes.getter().indexOf(hero_id);
        let existed_hero = NowFormHeroes.getter()[NowFormHeroes.indexOfFormSpot()]
        NowFormHeroes.oneHeroSet(NowFormHeroes.indexOfFormSpot(), hero_id);
        NowFormHeroes.oneHeroSet(hero_idx, existed_hero);
        NowFormHeroes.addHeroesInForm();
    }
    // 누른 영웅이 현재 편성에 들어있고 현재 선택한 자리에 누군가 있으며 스스로라면 삭제하기
    else if(NowFormHeroes.getter().includes(hero_id) && $(".spot-selected-full").length > 0 && NowFormHeroes.getter()[NowFormHeroes.indexOfFormSpot()] == hero_id){
        NowFormHeroes.removeByHeroId(hero_id);
        NowFormHeroes.reloadOnlySelected();
    }
    // 누른 영웅이 현재 편성에 없으면 그냥 자리 채우고 나열된 캐릭터에 선택된 표시
    else if(!NowFormHeroes.getter().includes(hero_id)){
        NowFormHeroes.oneHeroSet(NowFormHeroes.indexOfFormSpot(), hero_id);
        NowFormHeroes.reloadOnlySelected();
    }

    // 자리 선택 UI 표시
    let now_selected 
    if($(".spot-selected-full").length > 0) now_selected = $(".spot-selected-full").parent();
    else now_selected = $(".spot-selected-empty").parent();
    selectTargetForm(now_selected)

    // 편성에 있는 캐릭터 위에 X 표시
    NowFormHeroes.addSelectedEffect();

    // 쿼리스트링 추가
    NowFormHeroes.makeQueryString();
    
})

$(document).on("click", '.form_spot .out', function(){
    let hero_id = $(this).siblings('.select-liner').children('input').val();
    NowFormHeroes.removeByHeroId(hero_id);
    
    // 저장된대로 편성 UI 다시 표시
    NowFormHeroes.reloadOnlySelected();
    // NowFormHeroes.addHeroesInForm();
    selectTargetForm($(this).parent())

    // 편성에 있는 캐릭터 위에 X 표시
    NowFormHeroes.addSelectedEffect();

    // 쿼리스트링 추가
    NowFormHeroes.makeQueryString();
})

/***
 * 칸 클릭하면 다른 칸 선택 지워지고 클릭한 칸 선택됨
 ***/
$(document).on('click',".form_spot", function(e){

    if ($(e.target).hasClass("spot-selected-empty") || $(e.target).hasClass("spot-selected-full")) return;

    let spot = $(this);
    
    $(".form_spot .spot-selected-empty").remove();
    $(".form_spot .spot-selected-full").remove();
    $(".form_spot .out").remove();
    selectTargetForm(spot);
})

/**
 * 선택할 곳을 전달하면 선택함
 * @param {Object} t form_spot으로 찾는 Jquery 객체
 */
function selectTargetForm(t){
    $(".form-char-container .spot-selected-empty").remove();
    $(".form-char-container .spot-selected-full").remove();
    $('.form_spot .out').remove();
    if(t.find(".empty").length>0){
        t.prepend("<div class='spot-selected-empty'></div>");
    }else {
        t.prepend('<img src="/sources/img/out_char.png" class="out">');
        t.prepend("<div class='spot-selected-full'></div>");                   
    }
}