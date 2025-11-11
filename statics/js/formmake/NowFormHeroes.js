class NowFormHeroes{
    static heroes_arr = new Array(10).fill(0);

    static setter(arr){
        this.heroes_arr = arr;
        return this.heroes_arr;
    }
    
    static getter(arr){
        return this.heroes_arr;
    }

    static oneHeroSet(idx, hero_id){
        hero_id = parseInt(hero_id);
        this.heroes_arr[idx] = hero_id;
        return this.heroes_arr;
    }
    
    static removeByHeroId(hero_id){
        if(hero_id == 0) return Hthis.heroes_arr;
        hero_id = parseInt(hero_id);
        this.heroes_arr[this.heroes_arr.indexOf(hero_id)] = 0;
        return this.heroes_arr;
    }

    static init(num_of_heroes){
        this.heroes_arr = new Array(parseInt(num_of_heroes)).fill(0);
        return this.heroes_arr;
    }

    // 지금 선택되어 있는 게 몇 번째인지 반환
    static indexOfFormSpot(){
        let now_selected 
        if($(".spot-selected-full").length > 0) now_selected = $(".spot-selected-full").parent();
        else now_selected = $(".spot-selected-empty").parent();

        let idx = $('.form-container .form_spot').index(now_selected);
        return idx;
    }

    /**
     * 편성에 들어있는 영웅들에 선택된 이펙트 추가해줌.
     **/ 
    static addSelectedEffect(){
        $('.character-list-box .form-selected').remove();
        for(let i=0; i<this.heroes_arr.length; i++){
            $(`.character-list img[data-id = "${this.heroes_arr[i]}"]`).parent().before(`<div class="form-selected"><i class="fa-solid fa-plus color-gray"></i> </div> `);
        }
    }

    /**
     * 현재 선택된 자리만 리로드
     **/
    static reloadOnlySelected(){
        let i = this.indexOfFormSpot();
        let spot = $('.form-container .form_spot .select-liner').eq(i)
        // spot.empty();
        if(this.heroes_arr[i] == 0 || i > this.heroes_arr.length - 1){
            spot.html(`<div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                        <input value="0"  name="hero" type="hidden"> `);
        } else {
            spot.html(`<input value="${this.heroes_arr[i]}"  name="hero" type="hidden">`)
            let img = $(`.character-list img[data-id="${this.heroes_arr[i]}"]`).parent().children().clone().appendTo(spot);
        }
    }

    /**
     * heroes_arr에 저장된대로 편성 ui에 넣어줌
     **/
    static addHeroesInForm(){
        for(let i=0; i<$('.form-container .form_spot .select-liner').length; i++){
            let spot = $('.form-container .form_spot .select-liner').eq(i)
            spot.empty();
            if(this.heroes_arr[i] == 0 || i > this.heroes_arr.length - 1 || !this.heroes_arr[i]){
                spot.append(`<div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                            <input value="0"  name="hero" type="hidden"> `);
            } else {
                let img = $(`.character-list img[data-id="${this.heroes_arr[i]}"]`).parent().children().clone().appendTo(spot);
                spot.append(`<input value="${img.data('id')}"  name="hero" type="hidden">`)
            }
        }
    }

    /**
     * 편성 ui에 있는 영웅들을 hero_arr에 담음
     **/ 
    static addHeroesInArr(){
        for(let i=0; i<this.heroes_arr.length; i++){
            if(i > $('.form-container .form_spot input').length - 1)
                this.oneHeroSet(i, 0);
            else 
                this.oneHeroSet(i, $('.form-container .form_spot input').eq(i).val());
            
        }
    }

    /**
     * 현재 편성 상태로 영웅 쿼리스트링 만들어서 주소창에 적어주기
     **/
    static makeQueryString(){
        const url = new URL(window.location.href);
        url.searchParams.delete("hero");
        for(let i=0; i<this.heroes_arr.length; i++){
            url.searchParams.append("hero", this.heroes_arr[i]);
        }
        window.history.replaceState(null, '', url.toString())
    }

    /**
     * heroes_arr에 저장된대로 미리보기 ui에 넣어줌
     **/
    static addHeroesInPreview(){
        for(let i=0; i<$('.preview-detail-container .form_spot .select-liner').length; i++){
            let spot = $('.preview-detail-container .form_spot .select-liner').eq(i)
            spot.empty();
            if(this.heroes_arr[i] == 0 || i > this.heroes_arr.length - 1|| !this.heroes_arr[i]){
                spot.append(`<div class="empty"><i class="fa-solid fa-plus color-gray"></i> </div>
                            <input value="0"  name="hero" type="hidden"> `);
            } else {
                let img = $(`.character-list img[data-id="${this.heroes_arr[i]}"]`).parent().children().clone().appendTo(spot);
                spot.append(`<input value="${img.data('id')}"  name="hero" type="hidden">`)
            }
        }
    }
    
}