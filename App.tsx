/**
 * palmmaximilian
 * https://github.com/palmmaximilian/ReactNativeArduinoBLE
 * Accessed: 01.02.23
 * @format
 */

import React, {useState, useEffect} from 'react';
import {TouchableOpacity, Button, PermissionsAndroid, View, Text, FlatList, SafeAreaView, TextInput, LogBox, KeyboardAvoidingView, Platform} from 'react-native';
import {BleManager, Characteristic, Device} from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import {DeviceEventEmitter} from 'react-native';
import {ProgressBar, List} from 'react-native-paper';
import {Styles} from './Styles/styles';
import {File} from './File';
import {hex2a, base64ToHex, stringToHexArray, uint16ToInt16} from './Convert';
import {Calculations} from './Calculation';
import {Permissions} from './Permissions';    
import {Messages} from './Messages';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const BLEManager = new BleManager();
const FileManager = new File();
const CalManager = new Calculations();
const PermManager = new Permissions();
const MdsManager = new Messages();

//UUIDs for frisbee device
const SERVICE_UUID = '0000fe40-cc7a-482a-984a-7f2ed5b3e58f';
const COMMAND_UUID = '0000fe41-8e22-4541-9d4c-21edae82ed19';
const VOLTAGE_UUID = '0000fe42-8e22-4541-9d4c-21edae82ed19';
const DATA_UUID    = '0000fe43-8e22-4541-9d4c-21edae82ed19';
//Global variables
var totalPacketsFromThrowID = 0;
var totalPacketsFromThrowProgress = 0;
var totalValuesPerThrow = 0;
var totalThrowsDone = 0;
var totalFlashWrites = 0;
var lastestThrowId = 0;
var selectedThrowId = 0;
var batteryVoltage = 0;
var dataFromAccelerometers:any = [];
//Variables for creating Packet String
var hexStringPacketSize = new Uint8Array(6);
var hexStringPacketThrow = new Uint8Array(4);
var hexStringPacketTemplate = new Uint8Array([2, 0 ,0 ,0 ,0 ,0]); 
var hexStringPacketFrame = ''; 
//Variables for creating Data String
var hexStringDataSize = new Uint8Array(6);
var hexStringDataTemplate = new Uint8Array([3, 0]);
var hexStringDataFrame = '';

export default function Bluetooth() {
  //Is a device connected? / What device is connected?
  var [isConnected, setIsConnected] = useState(false); 
  var [connectedDevice, setConnectedDevice] = useState<Device>();  
  //Display Messages for interface
  const [interfaceDeviceThrowsDisplay, setInterfaceDeviceThrowsDisplay] = useState(0);
  const [interfaceDeviceLogDisplay, setInterfaceDeviceLogDisplay] = useState('');
  const [interfaceDeviceStatusDisplay, setInterfaceDeviceStatusDisplay] = useState<string>();
  const [interfaceAccelStatusDisplay, setInterfaceAccelStatusDisplay] = useState<string | null>();
  const [interfaceDeviceRotationDisplay, setInterfaceDeviceRotationDisplay] = useState('0');
  const [interfaceDeviceForceDisplay, setInterfaceDeviceForceDisplay] = useState('0');
  const [interfaceDeviceSpeedDisplay, setInterfaceDeviceSpeedDisplay] = useState('0');

  //Update Selected Throw Number
  var [inputThrowField, setInputThrowField] = useState<number>(0); 
  const handleThrowFieldChange = (text: string) => {
    const parsedValue = parseInt(text, 10) || 0; 
    const uintValue = Math.max(parsedValue, 0); 
    setInputThrowField(uintValue);
  };

  //Progressbar for interface
  var [colorProgressBar, setColorProgressBar] = useState('blue');
  const [progressBar, setProgressBar] = useState(0);
  const calculateProgressPercentage = () => {
    if (totalPacketsFromThrowProgress === 0) {
      return 0;
    }
    return ((totalPacketsFromThrowProgress - totalValuesPerThrow) / totalPacketsFromThrowProgress) * 100; //
  };

  //Progressbar for battery
  var [colorProgressBarBattery, setColorProgressBarBattery] = useState('');
  const [progressbarBattery, setProgressBarBattery] = useState(0);
  const calculateProgressBatteryPercentage = () => {
    var percent = CalManager.calculateBatteryPercentage(batteryVoltage);
    if (percent < 10) { //Sets progressbar color based on percent
      setColorProgressBarBattery('#8B0000');
    } else if (percent <  25) {
      setColorProgressBarBattery('red');
    } else if (percent <  75) {
      setColorProgressBarBattery('blue');
    } else if (percent <= 100) {
      setColorProgressBarBattery('green');
    } else {
      setColorProgressBarBattery('#841584');
    }
  }

  //Update state every 100 milliseconds
  useEffect(() => { 
    const interval = setInterval(() => {
      setProgressBar(calculateProgressPercentage()); //Updates data progressbar every 100ms
      setProgressBarBattery(CalManager.calculateBatteryPercentage(batteryVoltage)) //Updates battery progressbar percent every 100ms
      calculateProgressBatteryPercentage();
    }, 100);
    return () => clearInterval(interval);
  }, []);

  //Timeout Function to create a delay when using await
  function timeout(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms)); //Timeout function to work with async functions
  }

  //Promise Status
  let dataReceivedStatus = false;
  let resolveDataReceivedPromise: (value?: void) => void;
  //Trigger to confirm data is all received from device
  function onDataReceived() {
    dataReceivedStatus = true;
    if (resolveDataReceivedPromise) { //Resolves promise from data transfer
      resolveDataReceivedPromise();
    }
    DeviceEventEmitter.emit('dataReceived');
  }

  //Scan for frisbee devices
  async function scanForDevices() {
    try {
      await PermManager.requestPermissions(); //Request permissions from device, eg android phone
      console.log('Scanning for Device');
      // Display the ActivityIndicator
      BLEManager.startDeviceScan(null, null, (error, scannedDevice) => { //Starts BLE scan
        if (error) { 
          console.error('Scanning Failed to Start', error); //Failed BLE scan
        }
        if (scannedDevice && scannedDevice.name == 'Frisbee') { //If device name is Frisbee, it will try to connect to it.
          BLEManager.stopDeviceScan(); //Stops BLE scan if device is connected
          connectDevice(scannedDevice); //Run connectDevice() function
        }
      });
      // Stop scanning devices after 5 seconds
      setTimeout(() => {
        BLEManager.stopDeviceScan();
      }, 5000);
    } catch (error) {
      console.error('Permission request failed', error);
    }
  }
  
  //Connect to Device
  async function connectDevice(device: Device) {
    console.log('Connecting to Device');
    setInterfaceDeviceLogDisplay('Connecting');
    try {
      const connectedDevice = await device.connect(); //Await unit device is connected
      if (await connectedDevice.isConnected()) { //Checks if its connected
        setConnectedDevice(connectedDevice);
        setIsConnected(true);
        await connectedDevice.discoverAllServicesAndCharacteristics(); //Discovers all services and characteristics
        //  Set what to do when DC is detected
        BLEManager.onDeviceDisconnected(device.id, (error, device) => { //If device disconnects run this. Mostly resetting variables
          totalValuesPerThrow = 0;
          setColorProgressBar('#44d8be');
          console.warn('Device Disconnected');
          setIsConnected(false);
          setInterfaceDeviceLogDisplay('Shutdown');
          setInterfaceDeviceThrowsDisplay(0);
        });
        console.log('Connection established');
        setInterfaceDeviceLogDisplay('Connected');
        //Read initial values
        await monitorCharacteristicForService(connectedDevice); //Read initial values from monitorCharacteristicsForService once
      } else {
        console.warn('Device not connected');
      }
    } catch (error) {
      console.error(error);
    }
  }

  //Disconnect from device
  async function disconnectFromDevice() {
    console.log('Disconnecting from Device');
    if (connectedDevice != null) {
      const isDeviceConnected = await connectedDevice.isConnected(); //Controll is device is suddenly disconnected
      if (isDeviceConnected) {
        totalValuesPerThrow = 0;
        BLEManager.cancelTransaction('messagetransaction');
        BLEManager.cancelTransaction('datatransaction');
        BLEManager.cancelDeviceConnection(connectedDevice.id).then(() =>
        console.log('Disconnected from Device'),
        );
      }
      const connectionStatus = await connectedDevice.isConnected();
      if (!connectionStatus) {
        setIsConnected(false);
      }
    }
  }
  
  //Write HEX Value to UUID FE41, eg frisbee device
  function writeToCharacteristic(input: any, ) {
    return new Promise<void>((resolve, reject) => {
      if (!connectedDevice) { //Controll for device connection.
        setInterfaceDeviceLogDisplay('Failed, no device');
        reject(console.error('No connected device'));
      } else {
        BLEManager.writeCharacteristicWithoutResponseForDevice(connectedDevice.id, SERVICE_UUID, COMMAND_UUID, base64.encode(hex2a(input))) //Write values to COMMAND_UUID
          .then(() => {
            console.log('Write Request To Device: ', input); //Writes what data is being sent to device
            resolve();
          })
          .catch((error) => {
            console.error(error); //Printing error to console.
            reject(error);
          });
      }
    });
  }

  //Sends the first request to device, for throw data
  async function sendDataRequest(input:any) {
    const isDeviceConnected = await connectedDevice.isConnected();
    if (!isDeviceConnected) { //Check if device is still connected
      //disconnectFromDevice();
      console.warn('No connected device');
      setInterfaceDeviceLogDisplay('No connected device!');
      scanForDevices(); //Trying to reconnect if device isnt connected anymore, if BLE suddenly failed
      console.log('Trying to reconnect');
    } else {
      writeToCharacteristic(input);
    }
  }

  //Monitoring characteristics from frisbee device
  async function monitorCharacteristicForService(device: Device): Promise<void> {
    return new Promise<void>((resolve) => {
    //Message
      device.monitorCharacteristicForService(SERVICE_UUID, VOLTAGE_UUID, (error, characteristic) => { //Monitors UUID VOLTAGE_UUID, to check for new status update, eg battery voltagelevel and status messages.
        if (characteristic?.value != null) {
          const batteryBase64Data = base64ToHex(characteristic?.value); //Base64 to HEX convertion
          const batteryReceivedData = new Uint8Array(stringToHexArray(batteryBase64Data)); //HEX String to HEX Array convertion
          var batteryVoltageLevel = ((batteryReceivedData[0] << 8) | batteryReceivedData[1]);
          var deviceError = ((batteryReceivedData[3] << 8 | batteryReceivedData[4]));
          var deviceStatus = ((batteryReceivedData[5] << 8 | batteryReceivedData[6]));
          setInterfaceAccelStatusDisplay(MdsManager.errorMessages(deviceError)); //Updates accelerometer status on interface
          setInterfaceDeviceStatusDisplay(MdsManager.statusMessages(deviceStatus)); //Updates device status on interface
          batteryVoltage = batteryVoltageLevel / 1000; 
        }
      },
      'messagetransaction',
    );
    //Data
      device.monitorCharacteristicForService(SERVICE_UUID, DATA_UUID, (error, characteristic) => {
        if (characteristic?.value != null) {
          const receivedDataBase64 = base64ToHex(characteristic?.value); //Base64 to HEX convertion
          const receivedDataArray = new Uint8Array(stringToHexArray(receivedDataBase64)); //HEX String to HEX Array convertion
          if (receivedDataArray[8] == 1) { //Checks for instruction  byte value. If value = "0x01"
            lastestThrowId = ((receivedDataArray[0] << 24) | (receivedDataArray[1] << 16) | (receivedDataArray[2] << 8) | receivedDataArray[3]) - inputThrowField;
            totalThrowsDone = receivedDataArray[4];
            setInterfaceDeviceThrowsDisplay(lastestThrowId);
            totalValuesPerThrow = 0;
            console.log('Latest Throw: ', lastestThrowId + '\t Total Throw: ', totalThrowsDone);
          } else if (receivedDataArray[8] == 2) { //Checks for instruction  byte value. If value = "0x02"
            totalPacketsFromThrowID = receivedDataArray[4];
            totalValuesPerThrow = (totalPacketsFromThrowID + 1) * 680;
            // Right after setting the totalValuesPerThrow for the first time
            totalPacketsFromThrowProgress = totalValuesPerThrow;
            console.log('Total Packets to be Received: ', totalPacketsFromThrowID + '   Data Size: ', totalValuesPerThrow);
          } else if (receivedDataArray[8] == 3) { //Checks for instruction  byte value. If value = "0x03"
            var receivedDataArrayReverse = receivedDataArray.reverse();
            var valueY2 = uint16ToInt16((receivedDataArrayReverse[1] << 8) | receivedDataArrayReverse[2]);
            var valueY1 = uint16ToInt16((receivedDataArrayReverse[5] << 8) | receivedDataArrayReverse[6]);
            var valueX2 = uint16ToInt16((receivedDataArrayReverse[3] << 8) | receivedDataArrayReverse[4]);
            var valueX1 = uint16ToInt16((receivedDataArrayReverse[7] << 8) | receivedDataArrayReverse[8]);
            var valuesFromAccelerometer = new Int16Array([valueX1, valueX2, valueY1, valueY2]);
            totalValuesPerThrow--; //Removes one number from totalValuesPerThrow, to make sure all data is received.
            dataFromAccelerometers.push(valuesFromAccelerometer); //Pushes accelerometer data to array, before its written to FILE
            //console.log(totalValuesPerThrow, totalPacketsFromThrowProgress, totalPacketsFromThrowID);
            if (totalValuesPerThrow === 0) { //if totalValuesPerThrow isnt 0 when all data is transfer, eg failed to receive all data. User need to restart transfer.
              console.log('All data received, calling dataReceivedPromise');
              var outputDataArraySorted = dataFromAccelerometers.map(values => values.join('\t')).join('\n'); //Sorts accelerometer data with spaces and newlines
              var outputDataArrayUnsorted = dataFromAccelerometers; //Unsorted array with just values
              FileManager.writeToFile(outputDataArraySorted, FileManager.getFilePath('Report', selectedThrowId)); //Writes data from accelerometer array to FILE named Report_ID.txt
              FileManager.writeToFile(outputDataArrayUnsorted, FileManager.getFilePath('Report_Array', selectedThrowId)); //Writes data from accelerometer array to FILE named Report_Array_ID.txt
              var roundsPerSecondCalculated = CalManager.calculateRotationsPerSecond(outputDataArrayUnsorted); //Runs function to calculate RPS
              var forceCalculated = CalManager.calculateForceOnDisc(outputDataArrayUnsorted) //Runs function to calculate Force/g
              FileManager.writeToFile('Max Rotation Speed: ' + roundsPerSecondCalculated + '\t' + 'Max Force: ' + forceCalculated, FileManager.getFilePath('Report', selectedThrowId)); //Writes RPS and Force to file
              setInterfaceDeviceRotationDisplay(roundsPerSecondCalculated);
              setInterfaceDeviceForceDisplay(forceCalculated);
              onDataReceived();
            }
          } else if (receivedDataArray[8] == 4) { //Checks for instruction  byte value. If value = "0x04"
            totalFlashWrites = (receivedDataArray[0] << 24) | (receivedDataArray[1] << 16) | (receivedDataArray[2] << 8) | receivedDataArray[3];
            console.log('Total Flash Writes: ', totalFlashWrites);
            setInterfaceDeviceLogDisplay(totalFlashWrites.toString()); //Updates interface with how many rewrites device flash has
          } else {
            console.log('No Input Number');
          }
          
        }
      },
        'datatransaction',
    );
    });
  }

  //Function to send/receive requests to/from device
  async function receiveDataFromDevice (inputThrowField:number) {
    const isDeviceConnected = await connectedDevice.isConnected(); //Check if device is still connected
    let dataReceivedPromise: Promise<void>;
    if (!isDeviceConnected) { 
      //disconnectFromDevice();
      console.warn('No connected device')
      setInterfaceDeviceLogDisplay('No connected device!');
      scanForDevices(); //Trying to reconnect if device is not connected
      console.log('Trying to reconnect');
    } else { //If device is connected do this
      totalValuesPerThrow = (totalPacketsFromThrowID + 1) * 680; //Updates variable to maximum total packets from selected throw
      if (inputThrowField != null) { //Simple check for data in input textbox
        selectedThrowId = lastestThrowId - inputThrowField; //Subtract value from textbox from last throw ID
        var FilePath = '';
        console.log('Selected Throw: ', selectedThrowId); //Prints selected throw
        setInterfaceDeviceThrowsDisplay(selectedThrowId); 
        hexStringPacketThrow = new Uint8Array([selectedThrowId & 0xff, (selectedThrowId >> 8) & 0xff,]).reverse();  // Low Byte // high byte
        hexStringPacketSize.set(hexStringPacketTemplate); //Pushes hexStringPacketTemplate to hexStringPacketSize, eg sets the array to [2, 0, 0, 0, 0, 0]
        hexStringPacketSize.set(hexStringPacketThrow, 4); //Pushes hexStringPacketThrow to hexStringPacketSize, eg [2, 0, Throw value] 
        hexStringPacketFrame = hexStringPacketSize.reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), ''); //Adds zeros to hex value for the hex string
        FilePath = FileManager.getFilePath('Report', selectedThrowId); //Gets the filepath
        FileManager.checkForFile(FilePath); //Checks if file already exists on device, if true delete the old and write a new file.
        await timeout(200); //200ms timeout
        try {
          await writeToCharacteristic(hexStringPacketFrame); //Write hexStringPacketFrame to frisbee device
        } catch (error) {
          console.error(error); //Checks for errors, and print em
        }
        await timeout(200); //200ms timeout
      }
      while (totalValuesPerThrow) { 
        hexStringDataSize.set(hexStringDataTemplate); //Pushes hexStringDataTemplate to hexStringDataSize, eg sets the array to [3, 0, 0, 0, 0, 0]
        hexStringDataSize.set(hexStringPacketThrow, 4); //Pushes hexStringDataThrow to hexStringDataSize, eg sets the array to [3, 0, Throw value]
        hexStringDataFrame = hexStringDataSize.reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), ''); //Adds zeros to hex value for the hex string
        console.warn('Transfer Inprogress');
        setInterfaceDeviceLogDisplay('Transfer Inprogress');
        setColorProgressBar('#44d8be');
        try {
          await writeToCharacteristic(hexStringDataFrame); //Write hexStringDataFrame to frisbee device
        } catch (error) {
          console.error(error); //Checks for errors, and print em
        }
        if (!dataReceivedStatus) { //While data is received from device
          console.log('Waiting for dataReceivedPromise');
          dataReceivedPromise = new Promise<void>((resolve) => {
            resolveDataReceivedPromise = resolve; //Resolves promise when totalValuesPerThrow is equal to 0
            const onDataReceivedListener = () => {
              console.log('Resolving dataReceivedPromise');
              resolve();
              subscription.remove();
            };
            const subscription = DeviceEventEmitter.addListener('dataReceived', onDataReceivedListener);
          });
          var timeoutDuration = (1000 * totalPacketsFromThrowID) + 30000; // adjust timeout delay based on total packets in throw, eg total time for transfer pluss 30sec
          console.log('Timeout Delay: ', timeoutDuration); 
          await Promise.race([dataReceivedPromise, timeout(timeoutDuration)]); //Race between data transfer and timeout. If data transfer is stuck or failes, it will timeout and user can try to write data again.
          console.log('dataReceivedPromise resolved or timed out');
        } else {
          console.log('Data already received, skipping dataReceivedPromise');
        }
        if (totalValuesPerThrow === 0) { //If totalValuesPerThrow equals to 0, then display transfer as complete for user.
          setColorProgressBar('#bd35bd');
          dataFromAccelerometers = [];
          console.log('Transfer Complete');
          setInterfaceDeviceLogDisplay('Transfer Complete');
          break;
        } else { //If timeout duration is first, and totalValuesPerThrow isnt equal to 0, then display transfer as failed for user.
          setColorProgressBar('#f15a29');
          console.warn('Transfer NOT Complete, Try again');
          setInterfaceDeviceLogDisplay('Transfer NOT Complete, Try again');
          await timeout(2500); //2.5sec timeout
          break;
        }
      }
    }
  }



  return (
    <View>
      <View style={{paddingBottom: 20}}></View>

      {/* Title */}
      <View style={Styles.rowView}>
        <Text style={Styles.titleText}>Frisbee</Text>
      </View>

      <View style={{paddingBottom: 20}}></View>

      {/* Connect Button */}
      <View style={Styles.rowView}>
        <TouchableOpacity style={{width: 125}}>
          {!isConnected ? (
            <Button title='Connect' color='#44d8be' onPress={() => { scanForDevices(); }} disabled={false} />
          ) : (
            <Button title='Disonnect' color='#f15a29' onPress={() => { disconnectFromDevice(); }} disabled={false} />
          )}
        </TouchableOpacity>
      </View>

      <View style={{paddingBottom: 30}}></View>

      <View style={Styles.progressBarBatteryStyle}>
          <ProgressBar progress={progressbarBattery / 100} color={colorProgressBarBattery} />
      </View>

      <Text style={Styles.batteryPercentInfo}> {progressbarBattery.toFixed(0)}%</Text>
      <Text style={Styles.batteryVoltageInfo}> {(batteryVoltage).toFixed(1)}V</Text>

      <View style={Styles.rowView}>
        <View style={Styles.progressBarStyle}>
          <ProgressBar progress={progressBar  / 100} color={colorProgressBar} />
        </View>
      </View> 

      <View style={Styles.rowView}>
        <View style={Styles.buttonStyle}>
          <Button title='Receive Data' style={Styles.button} color='#841584' onPress={() => sendDataRequest('01')} />
        </View>
        <TextInput
            style={Styles.input}
            onChangeText={handleThrowFieldChange}
            value={inputThrowField.toString()}
            keyboardType='numeric'
          />
        <View style={Styles.buttonStyle}>
          <Button title='Print   Data' style={Styles.button} color='#841584' onPress={() => receiveDataFromDevice(inputThrowField)} />
        </View>
      </View>

      <View style={{paddingBottom: 30}}></View>



      <View style={{paddingBottom: 0}}></View>

      <View style={Styles.rowView}>
        <View style={Styles.buttonStyle}>
          <Button title="Flash" style={Styles.button} color='#841584' onPress={() => writeToCharacteristic('04')} />
        </View>
        <View style={Styles.buttonStyle}>
          <Button title='Shutdown' style={Styles.button} color='#841584' onPress={() => writeToCharacteristic('05')} />
        </View>
        <View style={Styles.buttonStyle}>
          <Button title='Extra' style={Styles.button} color='#841584' onPress={() => writeToCharacteristic('06')} />
        </View>
      </View>

      <View style={{paddingBottom: 100}}></View>

      <Text style={Styles.throwInfo}>Throw: {interfaceDeviceThrowsDisplay}</Text>
      <Text style={Styles.forceInfo}>Force: {interfaceDeviceForceDisplay} </Text>
      <Text style={Styles.rotationInfo}>RPS: {interfaceDeviceRotationDisplay} </Text>
      <Text style={Styles.speedInfo}>M/S: {interfaceDeviceSpeedDisplay} </Text>

      <Text style={Styles.logInfo}>LOG: {interfaceDeviceLogDisplay}</Text>
      <Text style={Styles.errorInfo}>ERROR: {interfaceAccelStatusDisplay}</Text>
      <Text style={Styles.statusInfo}>STATUS: {interfaceDeviceStatusDisplay} </Text>



            
    </View>
  );
}