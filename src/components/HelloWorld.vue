<template>
	<div class="hello">
        <DrawImage />
	</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import DrawImage from "@/views/DrawImage.vue";


interface Student {
	name: string;
	class: string;
	age: number;
}

@Component({
	components: {
		DrawImage
	}
})
export default class HelloWorld extends Vue {
	@Prop() private msg!: string;

	public title!: number | string;

	created(): void {}
	beforeCreate(): void {}
	beforeMount(): void {}
	mounted(): void {}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
