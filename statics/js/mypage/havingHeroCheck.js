

/**
 * 보유 영웅 설정 - 캐릭터 선택시 호출
 */

class HavingHeroChecker{
    
    static saved_heroes = []; // DB에 보유했다고 저장된 영웅 목록
    static checked_heroes = []; // 보유 영웅 설정에서 체크한 영웅 목록

    static add_check(idx){
        HavingHeroChecker.checked_heroes.push(idx);
        return HavingHeroChecker.checked_heroes;
    }
    
    static remove_check(idx){
        HavingHeroChecker.checked_heroes = HavingHeroChecker.checked_heroes.filter((element) => element !== idx)
        return HavingHeroChecker.checked_heroes;
    }

    static getter_check(){
        return HavingHeroChecker.checked_heroes;
    }

    static reset_check(){
        HavingHeroChecker.checked_heroes = [];
        return HavingHeroChecker.checked_heroes;
    }

    static getter_saved(){
        return HavingHeroChecker.saved_heroes;
    }

    static setter_saved(arr){
        HavingHeroChecker.saved_heroes = arr;
        return HavingHeroChecker.saved_heroes;
    }

    static remove_saved(idx){
        HavingHeroChecker.saved_heroes = HavingHeroChecker.saved_heroes.filter((element) => element !== idx)
        return HavingHeroChecker.saved_heroes;
    }

    static checked_heroes_recheck(){
        let char_list = $(".character-list");

        for(let i=0; i < char_list.length; i++){
            if((HavingHeroChecker.checked_heroes.includes(char_list.eq(i).children('img').data('id'))
            || HavingHeroChecker.saved_heroes.includes(char_list.eq(i).children('img').data('id')))
            && char_list.eq(i).children('i').length <= 0 )
            {
                char_list.eq(i).append(`<i class="havingheroset-check fa-solid fa-check"></i>`)
            }
        }
    }
    
    static checked_heroes_push(){
        let char_list = $(".character-list:has(i)");
        for(let i=0; i < char_list.length; i++){
            if(!HavingHeroChecker.checked_heroes.includes(char_list.eq(i).children('img').data('id'))
            && !HavingHeroChecker.saved_heroes.includes(char_list.eq(i).children('img').data('id'))
            && char_list.eq(i).children('i').length > 0 )
            {
                HavingHeroChecker.add_check(char_list.eq(i).children('img').data('id'))
            }
        }
    }

    static unchecked_heroes_remove(){
        let char_list = $(".character-list");

        for(let i=0; i < char_list.length; i++){
            if((HavingHeroChecker.checked_heroes.includes(char_list.eq(i).children('img').data('id'))
            || HavingHeroChecker.saved_heroes.includes(char_list.eq(i).children('img').data('id')))
            && char_list.eq(i).children('i').length <= 0 )
            {
                HavingHeroChecker.remove_check(char_list.eq(i).children('img').data('id'));
                HavingHeroChecker.remove_saved(char_list.eq(i).children('img').data('id'));

            }
        }
    }
}