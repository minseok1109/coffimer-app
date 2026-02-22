import { useMemo, useState } from 'react';

const MAX_IMAGE_COUNT = 5;

export function useBeanMultiImageFlow() {
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);

  const appendImages = (newUris: string[]) => {
    setImageUris((prev) => [...prev, ...newUris].slice(0, MAX_IMAGE_COUNT));
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
    setPrimaryIndex((prevPrimary) => {
      if (index === prevPrimary) return 0;
      if (index < prevPrimary) return prevPrimary - 1;
      return prevPrimary;
    });
  };

  const primaryImageUri = useMemo(() => {
    if (!imageUris.length) return null;
    return imageUris[Math.min(primaryIndex, imageUris.length - 1)] ?? null;
  }, [imageUris, primaryIndex]);

  return {
    imageUris,
    primaryIndex,
    primaryImageUri,
    appendImages,
    removeImage,
    setPrimaryIndex,
    maxImageCount: MAX_IMAGE_COUNT,
  };
}
