import { useCssElement } from "react-native-css";
import React from "react";
import { StyleSheet } from "react-native";
import type { ImageStyle, StyleProp } from "react-native";
import Animated from "react-native-reanimated";
import { Image as RNImage } from "expo-image";
import type { ImageContentFit, ImageContentPosition } from "expo-image";

const AnimatedExpoImage = Animated.createAnimatedComponent(RNImage);

export type ImageProps = React.ComponentProps<typeof Image>;

type RemappedImageStyle = ImageStyle & {
  objectFit?: ImageContentFit;
  objectPosition?: ImageContentPosition;
};

function CSSImage(props: React.ComponentProps<typeof AnimatedExpoImage>) {
  // Remap objectFit/objectPosition styles to expo-image contentFit/contentPosition props
  const { objectFit, objectPosition, ...style } = (StyleSheet.flatten(
    props.style as StyleProp<ImageStyle>,
  ) || {}) as RemappedImageStyle;

  return (
    <AnimatedExpoImage
      contentFit={objectFit}
      contentPosition={objectPosition}
      {...props}
      source={
        typeof props.source === "string" ? { uri: props.source } : props.source
      }
      style={style}
    />
  );
}

export const Image = (
  props: React.ComponentProps<typeof CSSImage> & { className?: string },
) => {
  // @ts-expect-error: Deep type instantiation with animated expo-image
  return useCssElement(CSSImage, props, { className: "style" });
};

Image.displayName = "CSS(Image)";
