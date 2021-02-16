import React, { useState, useEffect, useRef } from 'react';
import './style.css';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';
import InputFile from '../Utils/InputFile';
import { Box } from '@material-ui/core/';
import { VideoSetting } from '../Common/VideoSetting';

const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({ log: false });

export default function Bone() {
  let fileSize = 0;
  let uploadFileName = '';
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const cropToCanvas = (image, canvas, ctx) => {
    const naturalWidth = image.width;
    const naturalHeight = image.height;
    canvas.width = image.width;
    canvas.height = image.height;
    setImgWidth(image.width);
    setImgHeight(image.height);
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

  const loadImg = (fileName, index) => {
    let imgData;
    let imgElement;
    return new Promise((resolve, reject) => {
      imgData = ffmpeg.FS('readFile', fileName);
      imgElement = document.createElement('img');
      imgElement.onload = () => {
        onImageChange(imgElement, ffmpeg, fileName, index);
        resolve(imgElement);
      };
      imgElement.src = URL.createObjectURL(new Blob([imgData.buffer]));
    });
  };

  const transcode = async ({ target: { files } }) => {
    setLoading(true);
    const { name } = files[0];
    uploadFileName = name;
    await ffmpeg.load();
    ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
    ffmpeg.FS('mkdir', VideoSetting.inImage);
    await ffmpeg.run('-i', name, '-r', VideoSetting.rate, '-f', 'image2', `${VideoSetting.inImage}/${VideoSetting.imgFileName}`);

    let inImageDir = ffmpeg.FS('readdir', VideoSetting.inImage);
    let inImageDirData = inImageDir.filter((val) => { return val.match(VideoSetting.regexp); });
    fileSize = inImageDirData.length;

    let imgPromise = Promise.resolve();
    const loopImage = () => {
      let fileName;
      return new Promise(async (resolve, reject) => {
        for (var i = 1; i <= fileSize; i++) {
          fileName = `${VideoSetting.inImage}/${(`000000${i}`).slice(-6)}${VideoSetting.exp}`;
          imgPromise = imgPromise.then(loadImg.bind(this, fileName, i));
        }
      });
    };
    let imgLoopPromise = Promise.resolve();
    imgLoopPromise.then(loopImage.bind(this));
  }

  const skeltoneDraw = (ctx, data) => {
    ctx.clearRect(0, 0, imgWidth, imgHeight);
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
  };

  const memoryDataClear = () => {
    ffmpeg.FS('unlink', uploadFileName);
    ffmpeg.FS('unlink', VideoSetting.videoFileName);
    let fileName;
    for (let i = 1; i <= fileSize; i++) {
      fileName = `${(`000000${i}`).slice(-6)}${VideoSetting.exp}`;
      ffmpeg.FS('unlink', `${VideoSetting.inImage}/${fileName}`);
      ffmpeg.FS('unlink', fileName);
    }
    let readdir = ffmpeg.FS('readdir', '/');
    console.dir(readdir);
  }

  const onImageChange = (img, ffmpeg, fileName, index) => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    cropToCanvas(img, c, ctx);

    model.estimateSinglePose(c).then(async prediction => {
      skeltoneDraw(ctx, prediction.keypoints);
      let outFileName = `${(`000000${index}`).slice(-6)}${VideoSetting.exp}`;
      ffmpeg.FS('writeFile', outFileName, await fetchFile(c.toDataURL(VideoSetting.imgAccept)));

      // TODO:もう少しいい方法を考える
      if (index === fileSize) {
        const changeMovie = async () => {
          await ffmpeg.run(
            '-r', VideoSetting.rate,
            '-pattern_type', 'glob',
            '-i', `*${VideoSetting.exp}`,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-r', VideoSetting.rate,
            VideoSetting.videoFileName
          );
          const movie = ffmpeg.FS('readFile', 'out.mp4');
          const videoElement = document.getElementById('movie');
          videoElement.src = URL.createObjectURL(new Blob([movie.buffer]));

          setVideoData(await fetchFile(URL.createObjectURL(new Blob([movie.buffer]))));
          memoryDataClear();
          setLoading(false);
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
      <Box display='flex' justifyContent='center' m={1} p={1}>
        <InputFile
          id='movieInputFile'
          label='Movie Select'
          accept='video/*'
          buttonProps={{ color: 'primary' }}
          onChange={transcode}
          loading={loading}
        />
      </Box>
      <Box display={videoData !== null ? 'flex' : 'none'} m={1} p={1}>
        <video id='movie' controls />
      </Box>
    </>
  );
}