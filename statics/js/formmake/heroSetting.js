/**
 * 영웅 설정에 관한 js
 */

/**
 * 영웅 설정 버튼 클릭
 */
$('.charSetting-btn').on('click', function(e){
    // $(".spot-selected-full").siblings(".out").remove();
    // $(".spot-selected-full").remove();
    let selected = $(".spot-selected-full").siblings(".select-liner");

    console.log(selected);
    if(selected.length > 0){
        $('.own-modal').fadeIn();
        $('.hero-setting').fadeIn();

        $('.setting-charimg').html(selected.html())
        $('.setting-charname').children('img').attr('src', "../sources/img/types/dark.png")
        
        let lv = selected.children('.lv').text();
        $('.hero-setting .lv-input>input').val(lv)

        let cho = selected.children('.gak').text();
        $(`.hero-setting .${cho}cho`).prop("checked", true);

        let gak = selected.children('.gak').attr('class');
        gak = gak.split(' ')[0];
        $(`.hero-setting .${gak}-radio`).prop("checked", true);

    } else{ // 아무 영웅도 클릭하지 않았을 때
        // console.log("감지되지 않음");
        alert('설정할 영웅을 편성창에서 선택하세요.');

    }
})

$('.x-btn').on('click', function(e){
    $('.own-modal').fadeOut();
    $('.hero-setting').fadeOut();
})
