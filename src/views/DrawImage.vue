<template>
	<div class="hello" style="width: 100%;height: 100%">
		<ImageCompare ref="imgCompare" />
	</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import ImageCompare from "@/components/ImageCompare.vue";
@Component({
    components: {
       ImageCompare 
    }
})
export default class DrawImage extends Vue {
    public title!: number | string;
    

    public loading!: boolean;

    created(): void{

    }
    beforeCreate():void {
        
    }
    beforeMount():void {
        
    }
    mounted(): void {
        this.init()
    }

    init() {
        //var local = JSON.parse(localStorage.getItem('compareData'));
        let local = {
            type: "scene",
            rightIndex: 0,
            rightItemIndex: 0,
            left: 'http://192.168.0.112:8463/cachedata/2020/11/local/scene/OriginThumb/1647e77df2f04251bf768ae151530bcb.jpg',
            right: [
                {
                    uId: 'K110000000000202008000102',
                    id: 'fc1bc457fe2543b49c54c5524308d686',
                    picList: ['http://192.168.0.112:8463/cachedata/2020/08/local/scene/OriginThumb/fc1bc457fe2543b49c54c5524308d686.jpg',
                        'http://192.168.0.112:8463/cachedata/2020/08/local/scene/OriginThumb/668a1ecbad674a57ba52d9db7abb7078.jpg'
                    ]
                },
                {
                    uId: 'K110000000000202008000102',
                    id: 'fc1bc457fe2543b49c54c5524308d686',
                    picList: ['http://192.168.0.112:8463/cachedata/2020/08/local/scene/OriginThumb/fc1bc457fe2543b49c54c5524308d686.jpg']
                }
                
            ],
            imageInfos: Array<Object>()
        };

        if (local) {
            this.loading = true;
            var imageUrls = [local.left];
            local.right.map(p => { imageUrls = imageUrls.concat(p.picList)});

            let imagesInfos: Array<Object> = [];
            imageUrls.forEach(p => imagesInfos.push({
                originImageUrl: p,
                originImageShoesSign: null,
                thumbImageUrl: p.replace(/Origin/, 'Thumb'),
                thumbImageShoesSign: null,
                endImageUrl: p.replace(/Origin/, 'EndImage'),
                endImageShoesSign: null
            }));
            local.imageInfos = imagesInfos;
            (this as any).$refs["imgCompare"].initImage(local);
            this.loading = false;
        }
    }

}
</script>