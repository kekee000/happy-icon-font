import React from 'react';
import './icon.css';

export const enum Icons {
{% glyfList.forEach(function(glyf) { %}
    '{%=glyf.name%}' = '{%=glyf.codeName%}',
{% }); %}
}

export interface IconProps {
    name: Icons;
}

export const Icon: React.FC<IconProps> = ({name}) => {
  return (<i className={`icon icon-${name}`}></i>);
}