import {StyleSheet} from 'react-native';

export const Styles = StyleSheet.create({
  baseText: {
    fontSize: 15,
    fontFamily: 'Cochin',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#FDFEFE",
  },
  rowView: {
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  input: {
    height: 50,
    margin: 1,
    borderWidth: 1,
    padding: 10,
    width: 80,
    textAlign: 'center',
  },
  buttonStyle: {
    width: 100,
    textAlign: 'center',
  },
  buttonStyleThrowType: {
    width: 100,
    textAlign: 'center',
  },
  progressBarStyle: {
    height: 35,
    width: 330,
    borderRadius: 1,
    overflow: 'hidden',
  },
  button: {
    marginHorizontal: 20,
  },

  progressBarBatteryStyle: {
    position: 'absolute',
    top:20,
    right:15,
    height: 35,
    width: 50,
    borderRadius: 1,
    overflow: 'hidden',
  },
  batteryPercentInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:70,
    right:15,
    color: "#FDFEFE",
  },
  batteryVoltageInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:85,
    right:15,
    color: "#FDFEFE",
  },

  throwInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:85,
    left:15,
    color: "#FDFEFE",
  },

  rotationInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:340,
    left:22,
    color: "#FDFEFE",
  },
  forceInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:340,
    left:142,
    color: "#FDFEFE",
  },
  speedInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:340,
    left:262,
    color: "#FDFEFE",
  },
  
  logInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:430,
    left:22,
    color: "#FDFEFE",
  },
  errorInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:480,
    left:22,
    color: "#FDFEFE",
  },
  statusInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:530,
    left:22,
    color: "#FDFEFE",
  },



});