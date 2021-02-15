import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import MagicDropzone from "react-magic-dropzone";
import * as posenet from "@tensorflow-models/posenet";
import "@tensorflow/tfjs";
import './style.css';
const fs = require('fs');
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({ log: true });


export default function Pose() {

  const [preview, setPreview] = useState('');
  const [model, setModel] = useState(null);
  const onDrop = (accepted, rejected, links) => {
    setPreview(accepted[0].preview || links[0]);
  };
  const cropToCanvas = (image, canvas, ctx) => {
    const naturalWidth = image.width;
    const naturalHeight = image.height;
    canvas.width = image.width;
    canvas.height = image.height;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (naturalWidth > naturalHeight) {
      ctx.drawImage(
        image,
        (naturalWidth - naturalHeight) / 2,
        0,
        naturalHeight,
        naturalHeight,
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
    } else {
      ctx.drawImage(
        image,
        0,
        (naturalHeight - naturalWidth) / 2,
        naturalWidth,
        naturalWidth,
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
    }
  };

  const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

  let imgData;
  let img_element;
  const loadImg = (fileName, index) => {
    return new Promise((resolve, reject) => {
      console.log('loadImg promise');
      imgData = ffmpeg.FS('readFile', fileName);
      img_element = document.getElementById('movie_img');
      img_element.onload = () => {
        console.log('onload');
        onImageChange(img_element, ffmpeg, `${fileName}`, index);
        resolve(img_element);
      };
      img_element.src = URL.createObjectURL(new Blob([imgData.buffer]));
    });
  };

  const transcode = async ({ target: { files } }) => {
    const { name } = files[0];
    await ffmpeg.load();
    console.log('ffmpeg writeFile files');
    ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
    console.log('ffmpeg out img file');
    ffmpeg.FS('mkdir', '/inImage');
    await ffmpeg.run('-i', name, '-ss', '0', '-t', '2', '-r', '30', '-f', 'image2', '/inImage/%06d.jpg');

    let fileName;
    var imgPromise = Promise.resolve();
    const loopImage = () => {
      return new Promise(async (resolve, reject) => {
        for (var i = 1; i <= 60; i++) {
          fileName = `/inImage/${(`000000${i}`).slice(-6)}.jpg`;
          console.log(`ffmpeg readFile ${fileName}`);
          imgPromise = imgPromise.then(loadImg.bind(this, fileName, i));
        }
      });
    };
    var imgLoopPromise = Promise.resolve();
    imgLoopPromise = imgLoopPromise.then(loopImage.bind(this));
    console.log('end');

    // videoArray.map(async (id) => {
    //   fileName = `${(`000000${index}`).slice(-6)}.jpg`;
    //   console.log(`ffmpeg readFile ${fileName}`);
    //   await loadImg(fileName);
    //   index++;
    //   console.log(`index:${index}`);
    // });
  }

  const skeltoneDraw = (ctx, data) => {
    ctx.lineWidth = 3;
    // 肩
    ctx.strokeStyle = '#191970';
    ctx.beginPath();
    ctx.moveTo(data[5].position.x, data[5].position.y);
    ctx.lineTo(data[6].position.x, data[6].position.y);
    ctx.stroke();

    // 右腕
    ctx.strokeStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(data[6].position.x, data[6].position.y);
    ctx.lineTo(data[8].position.x, data[8].position.y);
    ctx.lineTo(data[10].position.x, data[10].position.y);
    ctx.stroke();

    // 左腕
    ctx.strokeStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(data[5].position.x, data[5].position.y);
    ctx.lineTo(data[7].position.x, data[7].position.y);
    ctx.lineTo(data[9].position.x, data[9].position.y);
    ctx.stroke();

    // 上半身下半身
    ctx.strokeStyle = '#7cfc00';
    ctx.beginPath();
    ctx.moveTo(data[5].position.x, data[5].position.y);
    ctx.lineTo(data[11].position.x, data[11].position.y);
    ctx.stroke();
    ctx.strokeStyle = '#7cfc00';
    ctx.beginPath();
    ctx.moveTo(data[6].position.x, data[6].position.y);
    ctx.lineTo(data[12].position.x, data[12].position.y);
    ctx.stroke();

    // ヒップ
    ctx.strokeStyle = '#3cb371';
    ctx.beginPath();
    ctx.moveTo(data[11].position.x, data[11].position.y);
    ctx.lineTo(data[12].position.x, data[12].position.y);
    ctx.stroke();

    // 右足
    ctx.strokeStyle = '#ff7f50';
    ctx.beginPath();
    ctx.moveTo(data[12].position.x, data[12].position.y);
    ctx.lineTo(data[14].position.x, data[14].position.y);
    ctx.lineTo(data[16].position.x, data[16].position.y);
    ctx.stroke();

    // 左足
    ctx.strokeStyle = '#f0e68c';
    ctx.beginPath();
    ctx.moveTo(data[11].position.x, data[11].position.y);
    ctx.lineTo(data[13].position.x, data[13].position.y);
    ctx.lineTo(data[15].position.x, data[15].position.y);
    ctx.stroke();

    // 左耳の線
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#0000cd';
    ctx.beginPath();
    ctx.setLineDash([2, 2]);
    ctx.moveTo(data[3].position.x, data[3].position.y - 50);
    ctx.lineTo(data[3].position.x, data[3].position.y);
    ctx.lineTo(data[3].position.x, data[3].position.y + 300);
    ctx.stroke();
  };

  // const onImageChange = e => {
  const onImageChange = (img, ffmpeg, fileName, index) => {
    const c = document.getElementById("canvas");
    const ctx = c.getContext("2d");
    console.log(`onImageChange:${fileName}`);
    cropToCanvas(img, c, ctx);

    model.estimateSinglePose(c).then(async prediction => {
      prediction.keypoints.forEach(keypoint => {
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
      skeltoneDraw(ctx, prediction.keypoints);
      let outFileName = `${(`000000${index}`).slice(-6)}.jpg`;
      console.log(`ffmpeg writeFile ${outFileName}`);
      ffmpeg.FS('writeFile', outFileName, await fetchFile(c.toDataURL('image/jpeg')));

      let imgElement = document.createElement('img');
      imgElement.src = c.toDataURL();
      const imgArea = document.getElementById("img_area");
      imgArea.appendChild(imgElement);

      if (index === 60) {
        console.log('ffmpeg out.mp4');
        const changeMovie = async () => {
          await ffmpeg.run('-r', '30', '-pattern_type', 'glob', '-i', '*.jpg', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', 'out.mp4');
          let files = ffmpeg.FS('readdir', '/');
          console.log('files /');
          console.dir(files);
          const movie = ffmpeg.FS('readFile', 'out.mp4');
          const video_element = document.getElementById('movie');
          video_element.src = URL.createObjectURL(new Blob([movie.buffer]));
        };
        changeMovie();
      }
    });

    return true;
  }

  useEffect(() => {
    posenet.load().then(model => {
      setModel(model);
    });
  }, []);

  return (
    <>
      <div className="Dropzone-page">
        <MagicDropzone
          className="Dropzone"
          accept="image/jpeg, image/png, .jpg, .jpeg, .png"
          multiple={false}
          onDrop={onDrop}
        >
          <img
            id='movie_img'
            alt="upload preview"
            // onLoad={onImageChange}
            className="Dropzone-img"
            src={preview}
          />
          <canvas id="canvas" />
        </MagicDropzone>
        <input type="file" id="uploader" onChange={transcode} />
        <video id='movie' controls />
      </div>
      <img
        id='change_img'
      />
      <div id='img_area'></div>
    </>
  );
}