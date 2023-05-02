import {PermissionsAndroid} from 'react-native';


export class Permissions {

  /**
  * Asked ChatGPT
  * https://chat.openai.com/
  * Date Accesed: 030/04/23
  */
  async requestPermissions() {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ];
    
    const permissionOptions = {
      title: 'Permission Request',
      message: 'This app requires the following permissions:',
      buttonNeutral: 'Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    };
  
    const results = await Promise.all(
      permissions.map((permission) => PermissionsAndroid.request(permission, permissionOptions))
    );
  
    results.forEach((result, index) => {
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error(`Permission not granted for ${permissions[index]}`);
      }
    });
  }
}