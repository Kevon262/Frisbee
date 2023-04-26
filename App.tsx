/**
 * palmmaximilian
 * https://github.com/palmmaximilian/ReactNativeArduinoBLE
 * Accessed: 01.02.23
 * @format
 */

import React, {useState, useEffect} from 'react';
import {TouchableOpacity, Button, PermissionsAndroid, View, Text, SafeAreaView, TextInput, LogBox, KeyboardAvoidingView, Platform} from 'react-native';
import {BleManager, Characteristic, Device} from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import {DeviceEventEmitter} from 'react-native';
import {ProgressBar, List} from 'react-native-paper';
import {Styles} from './Styles/styles';
import {File} from './File';
import {hex2a, base64ToHex, stringToHexArray, uint16ToInt16} from './Convert';
import {Calculations} from './Calculation';
import {Permissions} from './Permissions';    

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const BLEManager = new BleManager();
const FileManager = new File();
const CalManager = new Calculations();
const PermManager = new Permissions();

//UUIDs
const SERVICE_UUID = '0000fe40-cc7a-482a-984a-7f2ed5b3e58f';
const COMMAND_UUID = '0000fe41-8e22-4541-9d4c-21edae82ed19';
const VOLTAGE_UUID = '0000fe42-8e22-4541-9d4c-21edae82ed19';
const DATA_UUID    = '0000fe43-8e22-4541-9d4c-21edae82ed19';
//Variables:
var totalPacketsFromThrowID = 0;
var totalPacketsFromThrowProgress = 0;
var totalValuesPerThrow = 0;
var totalThrowsDone = 0;
var totalFlashWrites = 0;
var lastestThrowId = 0;
var selectedThrowId = 0;
var batteryVoltage = 0;
var batteryPercent = "";
var dataFromAccelerometers:any = [];
//Variables for creating Packet String
var hexStringPacketSize = new Uint8Array(6);
var hexStringPacketThrow = new Uint8Array(4);
var hexStringPacketTemplate = new Uint8Array([2, 0 ,0 ,0 ,0 ,0]); 
var hexStringPacketFrame = ""; 
//Variables for creating Data String
var hexStringDataSize = new Uint8Array(6);
var hexStringDataTemplate = new Uint8Array([3, 0]);
var hexStringDataFrame = "";


export default function Bluetooth() {
  //Is a device connected? / What device is connected?
  var [isConnected, setIsConnected] = useState(false); 
  var [connectedDevice, setConnectedDevice] = useState<Device>();  
  //Display Messages
  const [interfaceDeviceVoltageDisplay, setInterfaceDeviceVoltageDisplay] = useState(0);
  const [interfaceDeviceThrowsDisplay, setInterfaceDeviceThrowsDisplay] = useState(0);
  const [interfaceDeviceLogDisplay, setInterfaceDeviceLogDisplay] = useState("");
  const [interfaceDeviceStatusDisplay, setInterfaceDeviceStatusDisplay] = useState(0);
  const [interfaceDeviceRotationDisplay, setInterfaceDeviceRotationDisplay] = useState("0");
  const [interfaceDeviceSpeedDisplay, setInterfaceDeviceSpeedDisplay] = useState("0");
  const [interfaceAccelStatusDisplay, setInterfaceAccelStatusDisplay] = useState(0);
  const keyboardVerticalOffset = Platform.OS === 'ios' ? 64 : 50
  //Midlertidig settings
  var [inputNameField, setInputNameField] = useState<string>("");
  var [inputTypeField, setInputTypeField] = useState<string>("");
  var [inputDiscField, setInputDiscField] = useState<string>("");
  const handleDiscFieldChange = (text:string) => {setInputDiscField(text);};

  //Update Selected Throw Number
  var [inputThrowField, setInputThrowField] = useState<number>(0); 
  const handleThrowFieldChange = (text: string) => {
    const parsedValue = parseInt(text, 10) || 0; 
    const uintValue = Math.max(parsedValue, 0); 
    setInputThrowField(uintValue);
  };

  //Progressbar for interface
  var [colorProgressBar, setColorProgressBar] = useState("blue");
  const [progressBar, setProgressBar] = useState(0);
  const calculateProgressPercentage = () => {
    if (totalPacketsFromThrowProgress === 0) {
      return 0;
    }
    return ((totalPacketsFromThrowProgress - totalValuesPerThrow) / totalPacketsFromThrowProgress) * 100;
  };

  //Progressbar for battery
  var [colorProgressBarBattery, setColorProgressBarBattery] = useState("");
  const [progressbarBattery, setProgressBarBattery] = useState(0);
  const calculateProgressBatteryPercentage = () => {
    var percent = CalManager.calculateBatteryPercentage(batteryVoltage);
    if (percent < 10) {
      setColorProgressBarBattery("#8B0000");
    } else if (percent <  25) {
      setColorProgressBarBattery("red");
    } else if (percent <  75) {
      setColorProgressBarBattery("blue");
    } else if (percent <= 100) {
      setColorProgressBarBattery("green");
    } else {
      setColorProgressBarBattery("#841584");
    }
  }
  //Update progressbar state every 100 milliseconds
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressBar(calculateProgressPercentage());
      setProgressBarBattery(CalManager.calculateBatteryPercentage(batteryVoltage))
      calculateProgressBatteryPercentage();
    }, 100);
    return () => clearInterval(interval);
  }, []);

  //Timeout Function to create a delay when using await
  function timeout(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  //Promise Status
  let dataReceivedStatus = false;
  let resolveDataReceivedPromise: (value?: void) => void;
  //Trigger to confirm data is all received from device
  function onDataReceived() {
    dataReceivedStatus = true;
    if (resolveDataReceivedPromise) {
      resolveDataReceivedPromise();
    }
    DeviceEventEmitter.emit('dataReceived');
  }

  async function writeExtraInformation () {
    var throwInformation = ("Type: " + inputTypeField + "\t Name: " + inputNameField + "\t Extra: " + inputDiscField);
    FileManager.writeToFile(throwInformation, FileManager.getFilePath("Report", selectedThrowId));
    setInterfaceDeviceLogDisplay('Added Extra');
    await timeout(200);
    setInputTypeField("");
    setInputNameField("");
    setInputDiscField("");
  }

  //Scan for Devices
  async function scanForDevices() {
    try {
      await PermManager.requestPermissions();
      console.log('Scanning for Device');
      // Display the ActivityIndicator
      BLEManager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          console.error('Scanning Failed to Start', error);
        }
        if (scannedDevice && scannedDevice.name == 'Frisbee') {
          BLEManager.stopDeviceScan();
          connectDevice(scannedDevice);
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
      const connectedDevice = await device.connect();
      if (await connectedDevice.isConnected()) {
        setConnectedDevice(connectedDevice);
        setIsConnected(true);
        await connectedDevice.discoverAllServicesAndCharacteristics();
        //  Set what to do when DC is detected
        BLEManager.onDeviceDisconnected(device.id, (error, device) => {
          totalValuesPerThrow = 0;
          setColorProgressBar("#44d8be");
          console.warn('Device Disconnected');
          setIsConnected(false);
          setInterfaceDeviceLogDisplay('Shutdown');
          setInterfaceDeviceThrowsDisplay(0);
        });
        console.log('Connection established');
        setInterfaceDeviceLogDisplay('Connected');
        //Read initial values
        await monitorCharacteristicForService(connectedDevice);
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
      const isDeviceConnected = await connectedDevice.isConnected();
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
  
  //Write Value to UUID FE41
  function writeToCharacteristic(input: any, ) {
    return new Promise<void>((resolve, reject) => {
      if (!connectedDevice) {
        setInterfaceDeviceLogDisplay('Failed, no device');
        reject(console.error('No connected device'));
      } else {
        BLEManager.writeCharacteristicWithoutResponseForDevice(connectedDevice.id, SERVICE_UUID, COMMAND_UUID, base64.encode(hex2a(input)))
          .then(() => {
            //console.log('Write Request To Device: ', input);
            resolve();
          })
          .catch((error) => {
            console.error(error);
            reject(error);
          });
      }
    });
  }

  //Sends the first request to device, for throw data
  async function sendDataRequest(input:any) {
    const isDeviceConnected = await connectedDevice.isConnected();
    if (!isDeviceConnected) {
      //disconnectFromDevice();
      console.warn('No connected device');
      setInterfaceDeviceLogDisplay('No connected device!');
      scanForDevices();
      console.log('Trying to reconnect');
    } else {
      writeToCharacteristic(input);
    }
  }

  //Connect the device and start monitoring characteristics
  async function monitorCharacteristicForService(device: Device): Promise<void> {
    return new Promise<void>((resolve) => {
    //Message
      device.monitorCharacteristicForService(SERVICE_UUID, VOLTAGE_UUID, (error, characteristic) => {
        if (characteristic?.value != null) {
          const batteryBase64Data = base64ToHex(characteristic?.value);
          const batteryReceivedData = new Uint8Array(stringToHexArray(batteryBase64Data));
          var batteryVoltageLevel = ((batteryReceivedData[0] << 8) | batteryReceivedData[1]);
          var deviceAccelerometerError = ((batteryReceivedData[3] << 8 | batteryReceivedData[4]));
          var deviceStatus = ((batteryReceivedData[5] << 8 | batteryReceivedData[6]));
          setInterfaceAccelStatusDisplay(deviceAccelerometerError);
          setInterfaceDeviceStatusDisplay(deviceStatus);
          //setInterfaceDeviceVoltageDisplay(batteryVoltageLevel / 1000);
          batteryVoltage = batteryVoltageLevel / 1000;
        }
      },
      'messagetransaction',
    );
    //Data
      device.monitorCharacteristicForService(SERVICE_UUID, DATA_UUID, (error, characteristic) => {
        if (characteristic?.value != null) {
          const receivedDataBase64 = base64ToHex(characteristic?.value);
          const receivedDataArray = new Uint8Array(stringToHexArray(receivedDataBase64));
          if (receivedDataArray[8] == 1) {
            lastestThrowId = ((receivedDataArray[0] << 24) | (receivedDataArray[1] << 16) | (receivedDataArray[2] << 8) | receivedDataArray[3]) - inputThrowField;
            totalThrowsDone = receivedDataArray[4];
            setInterfaceDeviceThrowsDisplay(lastestThrowId);
            totalValuesPerThrow = 0;
            console.log("Latest Throw: / Total Throw: ", lastestThrowId + "\t", totalThrowsDone);
            selectedThrowId = lastestThrowId - inputThrowField;
          } else if (receivedDataArray[8] == 2) {
            totalPacketsFromThrowID = receivedDataArray[4];
            totalValuesPerThrow = (totalPacketsFromThrowID + 1) * 680;
            // Right after setting the totalValuesPerThrow for the first time
            totalPacketsFromThrowProgress = totalValuesPerThrow;
            console.log("Total Packets to be Received: ", totalPacketsFromThrowID + "   Data Size: ", totalValuesPerThrow);
          } else if (receivedDataArray[8] == 3) {
            var receivedDataArrayReverse = receivedDataArray.reverse();
            var valueY2 = uint16ToInt16((receivedDataArrayReverse[1] << 8) | receivedDataArrayReverse[2]);
            var valueY1 = uint16ToInt16((receivedDataArrayReverse[5] << 8) | receivedDataArrayReverse[6]);
            var valueX2 = uint16ToInt16((receivedDataArrayReverse[3] << 8) | receivedDataArrayReverse[4]);
            var valueX1 = uint16ToInt16((receivedDataArrayReverse[7] << 8) | receivedDataArrayReverse[8]);
            var valuesFromAccelerometer = new Int16Array([valueX1, valueX2, valueY1, valueY2]);
            totalValuesPerThrow--;
            dataFromAccelerometers.push(valuesFromAccelerometer);
            //console.log(totalValuesPerThrow, totalPacketsFromThrowProgress, totalPacketsFromThrowID);
            if (totalValuesPerThrow === 0) {
              console.log("All data received, calling dataReceivedPromise");
              var outputDataArraySorted = dataFromAccelerometers.map(values => values.join('\t')).join('\n');
              var outputDataArrayUnsorted = dataFromAccelerometers;
              FileManager.writeToFile(outputDataArraySorted, FileManager.getFilePath("Report", selectedThrowId));
              FileManager.writeToFile(outputDataArrayUnsorted, FileManager.getFilePath("Report_Array", selectedThrowId));
              var roundsPerSecondCalculated = CalManager.calculateRotationsPerSecond(outputDataArrayUnsorted);
              var forceCalculated = CalManager.calculateForceOnDisc(outputDataArrayUnsorted)
              FileManager.writeToFile("Max Rotation Speed: " + roundsPerSecondCalculated + '\t' + "Max Force: " + forceCalculated, FileManager.getFilePath("Report", selectedThrowId));
              setInterfaceDeviceRotationDisplay(roundsPerSecondCalculated);
              setInterfaceDeviceSpeedDisplay(forceCalculated);
              onDataReceived();
            }
          } else if (receivedDataArray[8] == 4) {
            totalFlashWrites = (receivedDataArray[0] << 24) | (receivedDataArray[1] << 16) | (receivedDataArray[2] << 8) | receivedDataArray[3];
            console.log("Total Flash Writes: ", totalFlashWrites);
            setInterfaceDeviceLogDisplay(totalFlashWrites.toString());
          } else {
            console.log("No Input Number");
          }
          
        }
      },
        'datatransaction',
    );
    });
  }

  //Function to send/receive requests to/from device
  async function receiveDataFromDevice (inputThrowField:number) {
    const isDeviceConnected = await connectedDevice.isConnected();
    let dataReceivedPromise: Promise<void>;
    if (!isDeviceConnected) {
      //disconnectFromDevice();
      console.warn('No connected device')
      setInterfaceDeviceLogDisplay('No connected device!');
      scanForDevices();
      console.log('Trying to reconnect');
    } else {
      totalValuesPerThrow = (totalPacketsFromThrowID + 1) * 680;
      if (inputThrowField != null) {
        selectedThrowId = lastestThrowId - inputThrowField;
        var FilePath = "";
        console.log("Selected Throw: ", selectedThrowId);
        setInterfaceDeviceThrowsDisplay(selectedThrowId);
        hexStringPacketThrow = new Uint8Array([selectedThrowId & 0xff, (selectedThrowId >> 8) & 0xff,]).reverse();  // Low Byte // high byte
        hexStringPacketSize.set(hexStringPacketTemplate);
        hexStringPacketSize.set(hexStringPacketThrow, 4);   
        hexStringPacketFrame = hexStringPacketSize.reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');
        FilePath = FileManager.getFilePath("Report", selectedThrowId);
        FileManager.checkForFile(FilePath);
        await timeout(200);
        try {
          await writeToCharacteristic(hexStringPacketFrame);
        } catch (error) {
          console.error(error);
        }
        await timeout(200);
      }
      while (totalValuesPerThrow) {
        hexStringDataSize.set(hexStringDataTemplate);
        hexStringDataSize.set(hexStringPacketThrow, 4);
        hexStringDataFrame = hexStringDataSize.reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');
        console.warn("Transfer Inprogress");
        setColorProgressBar("#44d8be");
        try {
          await writeToCharacteristic(hexStringDataFrame);
        } catch (error) {
          console.error(error);
        }
        if (!dataReceivedStatus) {
          console.log("Waiting for dataReceivedPromise");
          dataReceivedPromise = new Promise<void>((resolve) => {
            resolveDataReceivedPromise = resolve;
            const onDataReceivedListener = () => {
              console.log("Resolving dataReceivedPromise");
              resolve();
              subscription.remove();
            };
            const subscription = DeviceEventEmitter.addListener('dataReceived', onDataReceivedListener);
          });
          var timeoutDuration = (1000 * totalPacketsFromThrowID) + 10000; // adjust timeout delay based on total packets in throw
          console.log("Timeout Delay:", timeoutDuration); 
          await Promise.race([dataReceivedPromise, timeout(timeoutDuration)]);
          console.log("dataReceivedPromise resolved or timed out");
        } else {
          console.log("Data already received, skipping dataReceivedPromise");
        }
        if (totalValuesPerThrow === 0) {
          setColorProgressBar("#bd35bd");
          dataFromAccelerometers = [];
          console.log("Transfer Complete");
          setInterfaceDeviceLogDisplay('Transfer Complete');
          break;
        } else {
          setColorProgressBar("#f15a29");
          //FileManager.checkFile(selectedThrowId);
          console.warn("Transfer NOT Complete, Try again");
          setInterfaceDeviceLogDisplay('Transfer NOT Complete, Try again');
          totalValuesPerThrow = (totalPacketsFromThrowID + 1) * 680;
          await timeout(2500);
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
            <Button title="Connect" color='#44d8be' onPress={() => { scanForDevices(); }} disabled={false} />
          ) : (
            <Button title="Disonnect" color='#f15a29' onPress={() => { disconnectFromDevice(); }} disabled={false} />
          )}
        </TouchableOpacity>
      </View>

      <View style={{paddingBottom: 20}}></View>

      <Text style={Styles.throwInfo}>Throw: {interfaceDeviceThrowsDisplay}</Text>
      <Text style={Styles.forceInfo}>Force: {interfaceDeviceSpeedDisplay} </Text>
      <Text style={Styles.rotationInfo}>RPS: {interfaceDeviceRotationDisplay} </Text>

      <View style={Styles.progressBarBatteryStyle}>
          <ProgressBar progress={progressbarBattery / 100} color={colorProgressBarBattery} />
      </View>

      <Text style={Styles.batteryPercentInfo}> {progressbarBattery.toFixed(0)}%</Text>
      <Text style={Styles.batteryVoltageInfo}> {(batteryVoltage).toFixed(1)}V</Text>

      <View style={{paddingBottom: 10}}></View>

      <View style={Styles.rowView}>
        <View style={Styles.buttonStyle}>
          <Button title="Receive Data" style={Styles.button} color="#841584" onPress={() => sendDataRequest('01')} />
        </View>
        <TextInput
            style={Styles.input}
            onChangeText={handleThrowFieldChange}
            value={inputThrowField.toString()}
            keyboardType="numeric"
          />
        <View style={Styles.buttonStyle}>
          <Button title="Print   Data" style={Styles.button} color="#841584" onPress={() => receiveDataFromDevice(inputThrowField)} />
        </View>
      </View>

      <View style={{paddingBottom: 30}}></View>

      <View style={Styles.rowView}>
        <View style={Styles.progressBarStyle}>
          <ProgressBar progress={progressBar  / 100} color={colorProgressBar} />
        </View>
      </View> 

      <View style={{paddingBottom: 0}}></View>

      <View style={Styles.rowView}>
        <View style={Styles.buttonStyle}>
          <Button title="Flash" style={Styles.button} color="#841584" onPress={() => writeToCharacteristic('04')} />
        </View>
        <View style={Styles.buttonStyle}>
          <Button title="Power" style={Styles.button} color="#841584" onPress={() => writeToCharacteristic('05')} />
        </View>
        <View style={Styles.buttonStyle}>
          <Button title="Extra" style={Styles.button} color="#841584" onPress={() => writeExtraInformation()} />
        </View>
      </View>

      <View style={{paddingBottom: 20}}></View>

      <View style={Styles.rowView}>
        <Text style={Styles.baseText}>Log: {interfaceDeviceLogDisplay}</Text>
      </View>

      <View style={{paddingBottom: 20}}></View>  
      
      <Text style={Styles.typeInfo}>Type: {inputTypeField}</Text>
      <View style={Styles.rowView}>
        <TextInput
          style={Styles.inputNameNType}
          onChangeText={handleDiscFieldChange}
          value={inputDiscField}
        />  
      </View>
      <Text style={Styles.nameInfo}>Name: {inputNameField}</Text>

      <View style={{paddingBottom: 30}}></View>

      <View style={Styles.rowView}>
        <View style={Styles.buttonStyleThrowType}>
          <Button title="Kevin" style={Styles.button} color="#f99221" onPress={() => setInputNameField("Kevin")} />
        </View>
        <View style={Styles.buttonStyleThrowType}>
          <Button title="Daniel" style={Styles.button} color="#f99221" onPress={() => setInputNameField("Daniel")} />
        </View>
      </View>

      <View style={{paddingBottom: 30}}></View>

      <View style={Styles.rowView}>
        <View style={Styles.buttonStyleThrowType}>
          <Button title="Tree" style={Styles.button} color="#f99221" onPress={() => setInputDiscField("Tree")} />
        </View>
        <View style={Styles.buttonStyleThrowType}>
          <Button title="Null" style={Styles.button} color="#f99221" onPress={() => setInputDiscField("")} />
        </View>
      </View>
      
      <View style={{paddingBottom: 30}}></View>

      <View style={Styles.rowView}>
      <View style={Styles.buttonStyleThrowType}>
          <Button title="Back" style={Styles.button} color="#f99221" onPress={() => setInputTypeField("Back")} />
        </View>
        <View style={Styles.buttonStyleThrowType}>
          <Button title="Fore" style={Styles.button} color="#f99221" onPress={() => setInputTypeField("Fore")} />
        </View>
      </View>

      <View style={{paddingBottom: 30}}></View>

      <View style={Styles.rowView}>
        <View style={Styles.buttonStyleThrowType}>
          <Button title="Nade" style={Styles.button} color="#f99221" onPress={() => setInputTypeField("Nade")} />
        </View>
        <View style={Styles.buttonStyleThrowType}>
          <Button title="Thawk" style={Styles.button} color="#f99221" onPress={() => setInputTypeField("Thawk")} />
        </View>
      </View>
              

    </View>
  );
}