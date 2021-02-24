import './App.css';
import Bone from './Analyze/Bone';
import SwingHuman from './3D/SwingHuman';
import { AppBar, Toolbar, Typography } from '@material-ui/core/';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  appBar: {
    top: 'auto',
    bottom: 0,
  }
}));

function App() {
  const classes = useStyles();

  return (
    <>
      {/* <SwingHuman /> */}
      <Bone />
      <AppBar position="fixed" color="primary" className={classes.appBar}>
        <Toolbar>
          <Typography variant='body2' color='initial' align='center' width={1}>
            Ver 0.1.0 Since 2021
          </Typography>
        </Toolbar>
      </AppBar>
    </>
  );
}

export default App;
