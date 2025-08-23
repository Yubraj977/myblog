import NextImage, { ImageProps } from 'next/image'

const basePath = process.env.BASE_PATH

const Image = ({ src, ...rest }: ImageProps) => {
  if (!src) {
    return null
  }
  return <NextImage src={`${basePath || ''}${src}`} {...rest} />
}

export default Image
