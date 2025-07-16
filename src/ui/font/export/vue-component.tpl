
<template>
    <i :class="`icon icon-${name}`"></i>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export const enum Icons {
{% glyfList.forEach(function(glyf) { %}
    '{%=glyf.name%}' = '{%=glyf.codeName%}',
{% }); %}
}

export default defineComponent({
name: 'Icon',
props: {
    name: {
    type: String as PropType<Icons>,
    required: true
    }
}
});
</script>

<style scoped>
@import './icon.css';
</style>
