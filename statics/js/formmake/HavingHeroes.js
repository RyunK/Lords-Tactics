/**
 * DB에서 받아온 원본을 훼손하지 않고 저장하는 클래스
 */
class HavingHeroes{
    static having_heroes  = having_heroes;
    static having_heroes_id = having_heroes_id;
    static hero_list = hero_list;

    static setter(heroes){
        this.having_heroes = heroes;
        return this.having_heroes;
    }

    static getter(){
        return this.having_heroes;
    }

    static setter_id(idxes){
        this.having_heroes_id = idxes;
        return this.having_heroes_id;
    }

    static getter_id(){
        return this.having_heroes_id;
    }

    static hero_list_getter(){
        return this.hero_list;
    }
}