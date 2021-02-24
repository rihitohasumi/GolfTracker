import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Typography, Grid, InputLabel, Select, MenuItem } from '@material-ui/core/';
import { makeStyles } from '@material-ui/core/styles';
import InputFile from '../Utils/InputFile';

const useStyles = makeStyles((theme) => ({
  select: {
    width: '100%',
  }
}));

function PoseNetForm(props, ref) {
  const classes = useStyles();
  const [architecture, setArchitecture] = useState('MobileNetV1');
  const [outputStride, setOutputStride] = useState(16);
  const [quantBytes, setQuantBytes] = useState(2);

  useImperativeHandle(ref, () => ({
    getSetting: () => {
      return {
        architecture: architecture,
        outputStride: outputStride,
        quantBytes: quantBytes
      };
    },
  }));

  return (
    <>
      <Typography variant="h6" gutterBottom>
        解析パラメータ
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <InputLabel id="demo-simple-select-label">フィルタ適用位置の間隔</InputLabel>
          <Select
            className={classes.select}
            value={architecture}
            onChange={(event) => {
              setArchitecture(event.target.value);
            }}
          >
            <MenuItem value={'MobileNetV1'}>MobileNetV1</MenuItem>
            <MenuItem value={'ResNet50'}>ResNet50</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12}>
          <InputLabel id="demo-simple-select-label">フィルタ適用位置の間隔</InputLabel>
          <Select
            className={classes.select}
            value={outputStride}
            onChange={(event) => {
              setOutputStride(event.target.value);
            }}
          >
            <MenuItem value={8}>8</MenuItem>
            <MenuItem value={16}>16</MenuItem>
            <MenuItem value={32}>32</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12}>
          <InputLabel id="demo-simple-select-label">量子の重み</InputLabel>
          <Select
            className={classes.select}
            value={quantBytes}
            onChange={(event) => {
              setQuantBytes(event.target.value);
            }}
          >
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={2}>2</MenuItem>
            <MenuItem value={1}>1</MenuItem>
          </Select>
        </Grid>

        <InputFile
          id='movieInputFile'
          label='Movie Select & Process'
          accept='video/*'
          buttonProps={{ color: 'primary' }}
          onChange={props.transcode}
          loading={props.loading}
        />
      </Grid>
    </>
  );
}

export default forwardRef(PoseNetForm);