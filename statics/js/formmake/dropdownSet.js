

/**
 * 드롭다운 세팅에 대한 코드
 */

/**
 * 드롭다운 시 아이콘 토글 함수
 **/
function dropdownIconToggle(btn){
    const now_i = btn.children('i')

    // btn.siblings('ul').slideToggle(150);

    if(now_i.hasClass("fa-angle-down")){
        now_i.attr('class', "fa-solid fa-angle-up");
    } else {
        now_i.attr('class', "fa-solid fa-angle-down");
    }
}

/**
 * 컨텐츠 이름을 쿼리에 추가
 * @param {string} value 
 */
function setContentQueryStringParam(value){
    const url = new URL(window.location.href);
    url.searchParams.set("content", value);
    window.history.replaceState(null, '', url.toString());
}

$('.form-status button').on('click', function(){
    $('.form-status ul').slideToggle();
    dropdownIconToggle($('.form-status button'))
})

$('.form-status li').on('click', function(){
    $('.form-status ul').slideUp();
    var tmp = $('.form-status button p').text();
    $('.form-status button p').text($(this).text());
    $(this).text(tmp);
    $('input[name="form_status"]').val($(this).text())


    if($('.form-status button').hasClass('btn-yellow')){
        $('.form-status button').addClass('btn-blue').removeClass('btn-yellow')
        $(this).addClass('btn-yellow').removeClass('btn-blue')
    } else {
        $('.form-status button').addClass('btn-yellow').removeClass('btn-blue')
        $(this).addClass('btn-blue').removeClass('btn-yellow')
    }

    dropdownIconToggle($('.form-status button'))

})

$('.content-name button').on('click', function(){
    $('.content-name ul').slideToggle();
    dropdownIconToggle($('.content-name button'))
})

$('.content-name li').on('click', function(){
    // 버튼 제목 바꾸기
    $('.content-name ul').slideUp();
    $('.content-name button p').text($(this).text());
    $('input[name="content_name"]').val($(this).data('engname'));
    dropdownIconToggle($('.content-name button'));

    // 쿼리 수정
    setContentQueryStringParam($(this).data('engname'));

    // 컨텐츠명에 맞게 편성 레이아웃 수정
    if($(this).data("heronum") == 5) to5layout();
    else if ($(this).data("heronum") == 10) to10layout();
    else to7layout();
})

function to5layout(){
    // 다 삭제
    let border_container = $('.form-container .form-border-container')
    border_container.children('div').remove();
    border_container.children('h5').remove();

    // 5명만 있는 레이아웃으로 만들고
    let add_form = $('<div>',{
        class : "form-char-container w-100 d-flex flex-wrap justify-content-center ",
    })

    for(let i=0; i<5; i++){
        add_form.append(`<div class="character-5 form_spot">
                            <div class="select-liner">
                                <div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                                <input value="0"  name="hero" type="hidden"> 
                            </div>
                        </div>`);
    }

    border_container.append(add_form);

    
    // 기존 캐릭터 UI에 추가
    NowFormHeroes.addHeroesInForm();
    NowFormHeroes.addSelectedEffect();
    // 캐릭터 array 길이를 5로
    NowFormHeroes.init(5);
    NowFormHeroes.addHeroesInArr();

    // 쿼리스트링 리셋
    NowFormHeroes.makeQueryString();

    // 제일 앞 칸 선택
    let spot = $('.form-container .form_spot').eq(0)
    if(spot.find(".empty").length>0){
        spot.prepend("<div class='spot-selected-empty'></div>");
    }else {
        spot.prepend('<img src="/sources/img/out_char.png" class="out">');
        spot.prepend("<div class='spot-selected-full'></div>");                   
    }
}

function to10layout(){
    // 다 삭제
    let border_container = $('.form-container .form-border-container')
    console.log(border_container)
    border_container.children('div').remove();
    border_container.children('h5').remove();

    // 10명 있는 레이아웃으로 만들고
    let add_form = $('<div>',{
        class : "form-char-container w-100 d-flex flex-wrap justify-content-center ",
    })

    for(let i=0; i<5; i++){
        add_form.append(`<div class="character-10 form_spot">
                            <div class="select-liner">
                                <div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                                <input value="0"  name="hero" type="hidden"> 
                            </div>
                        </div>`);
    }

    border_container.append(`<h5 class="w-100">1 부대</h5>`);
    border_container.append(add_form);
    border_container.append(`<h5 class="w-100">2 부대</h5>`);
    border_container.append(add_form.clone());

    
    // 기존 캐릭터를 UI에 추가
    NowFormHeroes.addHeroesInForm();
    NowFormHeroes.addSelectedEffect();
    // 캐릭터 array 길이를 10으로
    NowFormHeroes.init(10);
    NowFormHeroes.addHeroesInArr();

    // 쿼리스트링 리셋
    NowFormHeroes.makeQueryString();

    // 제일 앞 칸 선택
    let spot = $('.form-container .form_spot').eq(0)
    if(spot.find(".empty").length>0){
        spot.prepend("<div class='spot-selected-empty'></div>");
    }else {
        spot.prepend('<img src="/sources/img/out_char.png" class="out">');
        spot.prepend("<div class='spot-selected-full'></div>");                   
    }
}

function to7layout(){
    // 다 삭제
    let border_container = $('.form-container .form-border-container')
    border_container.children('div').remove();
    border_container.children('h5').remove();

    // 7명 있는 레이아웃으로 만들고
    let add_form = $('<div>',{
        class : "form-char-container w-100 d-flex flex-wrap justify-content-center ",
    })

    for(let i=0; i<7; i++){
        add_form.append(`<div class="character-7 form_spot">
                            <div class="select-liner">
                                <div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                                <input value="0"  name="hero" type="hidden"> 
                            </div>
                        </div>`);
        if(i == 2){
            add_form.append(`<div class="change-line"></div>`)
        }
    }

    border_container.append(add_form);

    
    // 기존 캐릭터를 UI에 추가
    NowFormHeroes.addHeroesInForm();
    NowFormHeroes.addSelectedEffect();
    // 캐릭터 array 길이를 7로
    NowFormHeroes.init(7);
    NowFormHeroes.addHeroesInArr();

    // 쿼리스트링 리셋
    NowFormHeroes.makeQueryString();

    // 제일 앞 칸 선택
    let spot = $('.form-container .form_spot').eq(0)
    if(spot.find(".empty").length>0){
        spot.prepend("<div class='spot-selected-empty'></div>");
    }else {
        spot.prepend('<img src="/sources/img/out_char.png" class="out">');
        spot.prepend("<div class='spot-selected-full'></div>");                   
    }
}




