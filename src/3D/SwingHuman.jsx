import React, { Suspense, useRef } from 'react';
import { Canvas, useLoader } from 'react-three-fiber';
import GLTFLoader from 'three-gltf-loader';
import { makeStyles } from '@material-ui/core/styles';
import humanData from './gltf/human.gltf';

const useStyles = makeStyles((theme) => ({
  thirdCanvas: {
    position: 'relative',
  }
}));

export default function SwingHuman() {
  const classes = useStyles();
  const ref = useRef();
  const LoadModel = () => {
    const gltf = useLoader(GLTFLoader, humanData);
    return (
      <primitive object={gltf.scene} dispose={null} />
    )
  };
  const UseModel = () => {
    return (
      // <Suspense fallback={null}>
      //   <LoadModel />
      // </Suspense>
      <mesh ref={ref} position={[0, -3, 0]} fallback={null}>
        <LoadModel />
      </mesh>
    )
  };

  return <>
    <Canvas>
      <mesh>
        <UseModel />
      </mesh>
    </Canvas>
  </>;
}

