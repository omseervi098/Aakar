// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.
import { Tensor } from "onnxruntime-web";
// @ts-ignore
import npyjs from "npyjs";
// Convert the onnx model mask prediction to ImageData
export function arrayToImageData(input: any, width: number, height: number) {
  const [r, g, b, a] = [0, 114, 189, 255]; // the masks's blue color
  const arr = new Uint8ClampedArray(4 * width * height).fill(0);
  for (let i = 0; i < input.length; i++) {
    // Threshold the onnx model mask prediction at 0.0
    // This is equivalent to thresholding the mask using predictor.model.mask_threshold
    // in python
    if (input[i] > 0.0) {
      arr[4 * i + 0] = r;
      arr[4 * i + 1] = g;
      arr[4 * i + 2] = b;
      arr[4 * i + 3] = a;
    }
  }
  return new ImageData(arr, height, width);
}

// Use a Canvas element to produce an image from ImageData
export function imageDataToImage(imageData: ImageData) {
  const canvas = imageDataToCanvas(imageData);
  const image = new Image();
  image.src = canvas.toDataURL();
  return image;
}

// Canvas elements can be created from ImageData
export function imageDataToCanvas(imageData: ImageData) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx?.putImageData(imageData, 0, 0);
  return canvas;
}

// Convert the onnx model mask output to an HTMLImageElement
export function onnxMaskToImage(input: any, width: number, height: number) {
  return imageDataToImage(arrayToImageData(input, width, height));
}

// loadnpy from file
export const loadNpyTensor = async (tensorFile: string, dType: string) => {
  let npLoader = new npyjs();
  const npArray = await npLoader.load(tensorFile);
  const tensor = new Tensor("float32", npArray.data, npArray.shape);
  return tensor;
};

//load npy from api response
export const loadNpyTensor1 = async (data: string, dType: string) => {
  const npLoader = new npyjs();
  const data1 = npLoader.parse(data);
  const tensor = new Tensor("float32", data1.data, data1.shape);
  return tensor;
};

// convert Image URL to blob format
export const convertURLtoFile = async (url: string, filename: string) => {
  // convert image url to image file
  return fetch(url)
    .then(function (res) {
      return res.blob();
    })
    .then(function (blob) {
      var file = new File([blob], filename, { type: "image/jpeg" });
      return file;
    });
};
// convert image element to image array data
export const convertImageEleToData = async (image: HTMLImageElement) => {
  const img = document.createElement("img");
  img.src = image.src;
  const data = (img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    return new ImageData(data, img.width, img.height);
  })();
  return data;
};
