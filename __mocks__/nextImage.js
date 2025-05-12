const NextImage = function ({ src, alt, ...props }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} {...props} />;
}; 
NextImage.displayName = 'NextImage';
module.exports = NextImage; 