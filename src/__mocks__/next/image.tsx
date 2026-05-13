import React from 'react';

const NextImage = ({ src, alt, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return React.createElement('img', { src, alt, ...rest });
};

export default NextImage;
