/**
 * 영웅 설정에 관한 js
 */

/**
 * 영웅 설정 UI에 관련 정보 삽입. UI는 .hero-setting으로 잡음.
 * @param {DOM} hero 캐릭터리스트에 있던 캐릭터 원본 .character-list
 */
function selectHeroSetting(hero){
    $('.setting-charimg').html(hero.html())

    $('.setting-charimg').empty();
    hero.children('img').clone().appendTo(".setting-charimg");
    hero.children('span').clone().appendTo('.setting-charimg');

    let name = hero.children('img').data('korname');
    $('.setting-charname p').text(name);

    let type = hero.children('img').data('type');
    $('.setting-charname').children('img').attr('src', `../sources/img/types/${type}.png`)
    
    let hero_id = hero.children('img').data('id');
    $('.hero-setting .setting-form input[name="hero"]').val(hero_id);

    let lv = hero.children('.lv').text();
    $('.hero-setting .lv-input>input').val(lv)

    let cho = hero.children('.gak').text().trim();
    if(cho.includes(5) || cho.includes(6) || cho.includes(7)) $(`.hero-setting .${cho}cho`).prop("checked", true);
    else $('.hero-setting input[name="cho"]').prop("checked", false);
    

    let gak = hero.children('.gak').attr('class');
    gak = gak.split(' ')[0];
    $(`.hero-setting .${gak}-radio`).prop("checked", true);
}



