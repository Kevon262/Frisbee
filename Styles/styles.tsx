import {StyleSheet} from 'react-native';

export const Styles = StyleSheet.create({
  baseText: {
    fontSize: 15,
    fontFamily: 'Cochin',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
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
    width: 60,
    textAlign: 'center',
  },
  inputNameNType: {
    height: 30,
    margin: -5,
    borderWidth: 1,
    padding: 0,
    width: 100,
    textAlign: 'center',
  },
  buttonStyleNameNType: {
    width: 80,
    textAlign: 'center',
  },
  buttonStyle: {
    width: 80,
    textAlign: 'center',
  },
  buttonStyleExtra: {
    width: 130,
    textAlign: 'center',
  },
  buttonStyleThrowType: {
    width: 100,
    textAlign: 'center',
  },
  progressBarStyle: {
    height: 35,
    width: 315,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarBatteryStyle: {
    position: 'absolute',
    top:35,
    right:20,
    height: 35,
    width: 50,
    borderRadius: 1,
    overflow: 'hidden',
  },
  button: {
    marginHorizontal: 20,
  },
  throwInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:30,
    left:20,
  },
  forceInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:50,
    left:20,
  },
  rotationInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:70,
    left:20,
  },
  typeInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:345,
    left:250,
  },
  nameInfo: {
    fontSize: 15,
    fontFamily: 'Cochin',
    position: 'absolute',
    top:345,
    left:20,
  },



});