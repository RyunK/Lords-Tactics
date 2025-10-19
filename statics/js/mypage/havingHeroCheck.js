

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

    static checked_heroes_recheck(){
        let char_list = $(".character-list");

        for(let i=0; i < char_list.length; i++){
            if(char_list.eq(i).children)
        }
    }
}