import React, { useState, useContext, useEffect, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import { Tensor } from "onnxruntime-web";
import axios from "axios";
import Image from "next/image";
import hexRgb from "hex-rgb";

import FileUpload from "../components/FileUpload/FileUpload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const ColorVisualiser = (props: any) => {
  // const [color, setColor] = useColor("hex", "#121212");
  console.log(props.model);
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<any>(null);
  const [tensor, setTensor] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

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
              <FileUpload fileInput={fileInput} setFile={setFile} />
            </div>
          </div>
        </div>
      )}
      {file && (
        <div className="colorvisualiser__container container-fluid m-0 p-0">
          <div className="row m-0 p-0 align-items-center">
            <div className="col-12 col-lg-9 colorvisualiser__container__left "></div>
          </div>
        </div>
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
