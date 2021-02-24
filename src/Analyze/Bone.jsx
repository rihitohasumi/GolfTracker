import React, { useState, useEffect, useRef } from 'react';
import './style.css';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';
import { Box, Paper, Grid, Accordion, AccordionSummary, AccordionDetails, Typography } from '@material-ui/core/';
import { VideoSetting } from '../Common/VideoSetting';
import PoseNetForm from './PoseNetForm';
import { makeStyles } from '@material-ui/core/styles';
import SnackBar from '../Utils/SnackBar';
import TimeLine from './TimeLine';
import MagicDropzone from 'react-magic-dropzone';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { skeltoneDraw } from '../Utils/SkeltoneDraw';
// import backSwing from './img/backSwing.png';
// import frontSwing from './img/frontSwing.png';

const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({ log: false });
const useStyles = makeStyles((theme) => ({
  appBar: {
    position: 'relative',
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
      width: 600,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  },
  stepper: {
    padding: theme.spacing(3, 0, 5),
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: theme.spacing(3),
    marginLeft: theme.spacing(1),
  },
}));

export default function Bone() {

  const classes = useStyles();
  let fileSize = 0;
  let uploadFileName = '';
  const settingRef = useRef();
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState({
    architecture: 'ResNet50',
    outputStride: 32,
    quantBytes: 4
  });
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState('');
  const [snackBarSeverity, setSnackBarSeverity] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [timeLineColor1, setTimeLineColor1] = useState('grey');
  const [timeLineColor2, setTimeLineColor2] = useState('grey');
  const [timeLineColor3, setTimeLineColor3] = useState('grey');
  const [videoView1, setVideoView1] = useState(false);
  const [videoView2, setVideoView2] = useState(false);
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

  const changeMovie = async (videoArea) => {
    setTimeLineColor2('primary');
    setTimeLineColor3('secondary');
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
    const videoElement = document.getElementById(videoArea);
    videoElement.src = URL.createObjectURL(new Blob([movie.buffer]));

    setVideoData(await fetchFile(URL.createObjectURL(new Blob([movie.buffer]))));
    memoryDataClear();
    setTimeLineColor3('primary');
    setLoading(false);
  };

  let imgPromise = Promise.resolve();
  const loopImage = () => {
    let fileName;
    return new Promise(async (resolve, reject) => {
      for (var i = 1; i <= fileSize; i++) {
        fileName = `${VideoSetting.inImage}/${(`000000${i}`).slice(-6)}${VideoSetting.exp}`;
        await imgPromise.then(loadImg.bind(this, fileName, i));
      }
      resolve(true);
    });
  };

  // const transcode = async ({ target: { files } }) => {
  const transcode = async (files, videoArea) => {
    await posenet.load(settingRef.current.getSetting()).then(async model => {
      setLoading(true);
      setTimeLineColor1('secondary');
      setModel(model);
      const { name } = files[0];
      uploadFileName = name;
      await ffmpeg.load();
      ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
      ffmpeg.FS('mkdir', VideoSetting.inImage);
      await ffmpeg.run('-i', name, '-r', VideoSetting.rate, '-f', 'image2', `${VideoSetting.inImage}/${VideoSetting.imgFileName}`);

      let inImageDir = ffmpeg.FS('readdir', VideoSetting.inImage);
      let inImageDirData = inImageDir.filter((val) => { return val.match(VideoSetting.regexp); });
      fileSize = inImageDirData.length;

      await loopImage();

      setTimeLineColor1('primary');
      setTimeLineColor2('secondary');
      let imgLoopPromise = Promise.resolve();
      await imgLoopPromise.then(loopImage.bind(this));
      changeMovie(videoArea);
    }).catch(e => {
      console.error(`error : ${e}`);
      setSnackBarOpen(true);
      setSnackBarMessage(`設定に誤りがあります。${e}`);
      setSnackBarSeverity('error');
    });
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
  };

  const onImageChange = (img, ffmpeg, fileName, index) => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    cropToCanvas(img, c, ctx);

    model.estimateSinglePose(c).then(async prediction => {
      skeltoneDraw(ctx, prediction.keypoints, imgWidth, imgHeight);
      let outFileName = `${(`000000${index}`).slice(-6)}${VideoSetting.exp}`;
      ffmpeg.FS('writeFile', outFileName, await fetchFile(c.toDataURL(VideoSetting.imgAccept)));
    });

    return true;
  };

  useEffect(() => {
    posenet.load().then(model => {
      setModel(model);
    });
  }, []);

  return (
    <>
      <Box display='flex' justifyContent='center' m={1} p={1}>
        <h1>ゴルフスイング解析ツール（α版）</h1>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={6} className='drop-zone-grid-1'>
          <MagicDropzone
            className='drop-zone'
            accept='video/*'
            onDrop={(accepted, rejected, links) => {
              transcode(accepted, 'movie_1');
            }}
            display={!videoView1 ? 'flex' : 'none'}
          >
            Drop Comparison Movie1
          </MagicDropzone>
          <Box
            justifyContent='center'
            display={videoView1 ? 'flex' : 'none'}
            m={1}
            p={1}
            style={{ marginBottom: '100px' }}>
            <video id='movie_1' controls />
          </Box>
        </Grid>
        <Grid item xs={6} className='drop-zone-grid-2'>
          <MagicDropzone
            className='drop-zone'
            accept='video/*'
            onDrop={(accepted, rejected, links) => {
              transcode(accepted, 'movie_2');
            }}
            display={!videoView2 ? 'flex' : 'none'}
          >
            Drop Comparison Movie2
          </MagicDropzone>
          <Box
            justifyContent='center'
            display={videoView2 ? 'flex' : 'none'}
            m={1}
            p={1}
            style={{ marginBottom: '100px' }}>
            <video id='movie_2' controls />
          </Box>
        </Grid>
      </Grid>
      <Grid container spacing={3} display={loading ? 'none' : 'flex'}>
        <Grid item xs={12} style={{ padding: '2em' }}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography className={classes.heading}>解析設定</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <main className={classes.layout}>
                <Paper className={classes.paper}>
                  <PoseNetForm transcode={transcode} loading={loading} ref={settingRef} />
                </Paper>
              </main>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
      <Box display={loading ? 'flex' : 'none'} m={1} p={1}>
        <TimeLine
          timeLineColor1={timeLineColor1}
          timeLineColor2={timeLineColor2}
          timeLineColor3={timeLineColor3}
        />
      </Box>
      {/* <Box justifyContent='center'
        display={videoData !== null ? 'flex' : 'none'} m={1} p={1}
        style={{ marginBottom: '100px' }}>
        <video id='movie' controls />
      </Box> */}
      <SnackBar
        open={snackBarOpen}
        setOpen={setSnackBarOpen}
        message={snackBarMessage}
        severity={snackBarSeverity}
      />
    </>
  );
}