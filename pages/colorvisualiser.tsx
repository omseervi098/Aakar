import React, { useState, useContext, useEffect, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import { Tensor } from "onnxruntime-web";
import axios from "axios";
import Image from "next/image";
import { handleImageScale } from "../utils/helpers/scaleHelper";
import { modelScaleProps } from "../utils/helpers/Interfaces";
import {
  onnxMaskToImage,
  loadNpyTensor,
  loadNpyTensor1,
  convertURLtoFile,
  convertImageEleToData,
  imageDataToImage,
} from "../utils/helpers/maskUtils";
import { modelData } from "../utils/helpers/onnxModelAPI";
import Stage from "../components/Stage";
import AppContext from "../utils/hooks/createContext";
import preimage from "../utils/preimage.json";
import hexRgb from "hex-rgb";
import FileUpload from "../components/FileUpload/FileUpload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Card } from "react-bootstrap";
const ColorVisualiser = (props: any) => {
  // const [color, setColor] = useColor("hex", "#121212");
  const {
    clicks: [clicks],
    image: [image, setImage],
    maskImg: [maskImg, setMaskImg],
    color: [color, setColor],
  } = useContext(AppContext)!;
  const { model } = props;
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<any>(null);
  const [tensor, setTensor] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);
  const handleShowModal = () => setShowModal(true);
  const handleShowLoader = () => setShowLoader(true);
  const handleCloseModal = () => setShowModal(false);
  const handleCloseLoader = () => setShowLoader(false);
  const getImageEmbedding = async (file: any) => {
    handleShowModal();
    const formData = new FormData();
    formData.append("image", file);
    await loadImage(file);
    try {
      const res = await axios.post(
        "http://localhost:5000/getembedding",
        formData,
        {
          responseType: "arraybuffer",
        }
      );
      const data = await res.data;
      Promise.resolve(loadNpyTensor1(data, "float32")).then((embedding) => {
        setTensor(embedding);
      });
      handleCloseModal();
    } catch (e) {
      handleCloseModal();
      setFile(null);
      console.log(e);
    }
  };

  const loadImage = async (imageFile: any) => {
    try {
      const img = document.createElement("img"); // create a new image object
      img.src = URL.createObjectURL(imageFile);
      img.onload = () => {
        const { height, width, samScale } = handleImageScale(img);
        setModelScale({
          height: height, // original image height
          width: width, // original image width
          samScale: samScale, // scaling factor for image which has been resized to longest side 1024
        });
        img.width = width;
        img.height = height;
        setImage(img);
      };
    } catch (error) {
      console.log(error);
    }
  };

  // Run the ONNX model every time clicks has changed
  useEffect(() => {
    runONNX();
  }, [clicks]);

  const runONNX = async () => {
    try {
      if (
        model === null ||
        clicks === null ||
        tensor === null ||
        modelScale === null
      )
        return;
      else {
        // Preapre the model input in the correct format for SAM.
        // The modelData function is from onnxModelAPI.tsx.
        const feeds = modelData({
          clicks,
          tensor,
          modelScale,
        });
        if (feeds === undefined) return;
        // Run the SAM ONNX model with the feeds returned from modelData()
        const results = await model.run(feeds);
        const output = results[model.outputNames[0]];
        // The predicted mask returned from the ONNX model is an array which is
        // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
        setMaskImg(
          onnxMaskToImage(output.data, output.dims[2], output.dims[3])
        );
      }
    } catch (e) {
      console.log(e);
    }
  };
  const handlePreloadedImage = (imagedetail: any) => {
    convertURLtoFile(imagedetail.image, imagedetail.name).then((file) => {
      setFile(file);
      const image = document.createElement("img");
      image.src = URL.createObjectURL(file);
      image.onload = () => {
        const { height, width, samScale } = handleImageScale(image);
        setModelScale({
          height: height, // original image height
          width: width, // original image width
          samScale: samScale, // scaling factor for image which has been resized to longest side 1024
        });
        image.width = width;
        image.height = height;
        setImage(image);
        Promise.resolve(
          loadNpyTensor(imagedetail.image_embedding, "float32")
        ).then((embedding) => {
          setTensor(embedding);
        });
      };
    });
  };
  const applyColor = async (
    image: HTMLImageElement,
    maskImg: HTMLImageElement,
    color: string
  ) => {
    try {
      handleShowLoader();
      if (!image || !maskImg || !color) return;
      const imageData = await convertImageEleToData(image);
      const maskData = await convertImageEleToData(maskImg);
      if (!imageData.data || !maskData.data) return;
      for (let i = 0; i < maskData.data.length; i += 4) {
        if (
          maskData.data[i] === 0 &&
          maskData.data[i + 1] === 114 &&
          maskData.data[i + 2] === 189
        ) {
          // color the pixel
          const rgb = hexRgb(color);
          imageData.data[i] = rgb.red;
          imageData.data[i + 1] = rgb.green;
          imageData.data[i + 2] = rgb.blue;
          imageData.data[i + 3] = 255;
        }
      }

      const finalImage = await imageDataToImage(imageData);
      setImage(finalImage);
      handleCloseLoader();
    } catch (e) {
      console.log(e);
      handleCloseLoader();
    }
  };
  return (
    <div className="colorvisualiser py-5 pb-5">
      {!file && (
        <div className="colorvisualiser__container container py-md-2 py-lg-5">
          <div className="row justify-content-center align-items-center gap-5 gap-lg-0">
            <div className="col-12 col-lg-6 colorvisualiser__container__left ">
              <h1 className="text-center mb-4">Visualize your Home</h1>
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-100 img-fluid"
              >
                <source
                  src="/Paint_Visualizer_7becb7495b.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
            <div className="col-12 col-lg-6 colorvisualiser__container__right">
              <FileUpload
                fileInput={fileInput}
                setFile={setFile}
                getEmbedding={getImageEmbedding}
              />
            </div>
          </div>
          <div className="row justify-content-center align-items-center gap-5 gap-lg-3 mt-5 ">
            <div className="col-12 colorvisualiser__container__left ">
              <h1 className="text-center">Try one of our preloaded images</h1>
            </div>
            {preimage.map((image: any, index: number) => {
              return (
                <Card
                  className="border-2 shadow-sm col-11 col-md-5 col-lg-3"
                  key={index}
                  onClick={() => handlePreloadedImage(image)}
                >
                  <Card.Body className="d-flex flex-column justify-content-between align-items-center p-0 pt-3">
                    <Card.Img
                      variant="top"
                      src={image.image}
                      className="img-fluid"
                      style={{
                        height: "200px",
                        objectFit: "cover",
                      }}
                    />
                    <Card.Title className="text-center">
                      {image.name}.png
                    </Card.Title>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {file && (
        <>
          <div className="colorvisualiser__container container-fluid m-0 p-0">
            <div className="row m-0 p-0 align-items-center">
              <div className="col-12 col-lg-9 colorvisualiser__container__left ">
                <Stage
                  handleShowLoader={handleShowLoader}
                  applyColor={applyColor}
                />
              </div>
            </div>
          </div>
          <Modal show={showLoader} onHide={handleCloseLoader} centered>
            <Modal.Body>
              <div className="spinner-border ms-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </Modal.Body>
          </Modal>
        </>
      )}
      {showModal && file && (
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Body>
            <div className="d-flex justify-content-between align-items-center ps-3">
              <Image
                src={URL.createObjectURL(file)}
                alt="Uploaded Image"
                width={100}
                height={100}
                className="img-fluid"
              />
              <Image
                src="https://segment-anything.com/assets/arrow-icn.svg"
                alt="Uploaded Image"
                width={40}
                height={100}
                className="img-fluid"
              />
              <Image
                src="https://segment-anything.com/assets/icn-nn.svg"
                width={100}
                height={100}
                alt="Neural Network"
                className="img-fluid"
              />
              <Image
                src="https://segment-anything.com/assets/arrow-icn.svg"
                alt="Uploaded Image"
                width={40}
                height={80}
                className="img-fluid"
              />
              <Image
                src="https://segment-anything.com/assets/stack.svg"
                width={100}
                height={10}
                style={{
                  height: "100px",
                  width: "100px",
                }}
                className="img-fluid"
                alt="Stack"
              />
            </div>
            <div className="d-flex justify-content-center align-items-center fw-bold mt-2">
              Generating Image Embedding
              <div className="spinner-border ms-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};
export default ColorVisualiser;
