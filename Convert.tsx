//Convertions

import base64 from 'react-native-base64';

/**
* How to convert from Hex to ASCII in JavaScript?
* Date Accesed: 30/03/23
* https://stackoverflow.com/questions/3745666/how-to-convert-from-hex-to-ascii-in-javascript
*/
export function a2hex(str:any) {
  var arr = [];
  for (var i = 0, l = str.length; i < l; i ++) {
    var hex = Number(str.charCodeAt(i)).toString(16);
    arr.push(hex);
  }
  return arr.join('');
}
  
/**
* How to convert from Hex to ASCII in JavaScript?
* Date Accesed: 30/03/23
* https://stackoverflow.com/questions/3745666/how-to-convert-from-hex-to-ascii-in-javascript
*/
export function hex2a(hexx:any) {
  var hex = hexx.toString(); //force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

/**
* Convert From/To Binary/Decimal/Hexadecimal in JavaScript
* https://gist.github.com/faisalman/4213592
* Date Accesed: 10/02/23
*
* Copyright 2012-2015, Faisalman <fyzlman@gmail.com>
* Licensed under The MIT License
* http://www.opensource.org/licenses/mit-license
*/
export var convertBase = function () {
  function convertBase(baseFrom:any, baseTo:any) {
    return function (num:any) {
        return parseInt(num, baseFrom).toString(baseTo);
    };
  }
  // binary to decimal
  convertBase.bin2dec = convertBase(2, 10);
  // binary to hexadecimal
  convertBase.bin2hex = convertBase(2, 16);
  // decimal to binary
  convertBase.dec2bin = convertBase(10, 2);
  // decimal to hexadecimal
  convertBase.dec2hex = convertBase(10, 16);
  // hexadecimal to binary
  convertBase.hex2bin = convertBase(16, 2);
  // hexadecimal to decimal
  convertBase.hex2dec = convertBase(16, 10);
  return convertBase;
}();

/**
* Asked ChatGPT / Personal Chat
* https://chat.openai.com/
* Date Accesed: 07/03/23
*/
export function base64ToHex(base64String:any) {
  var bytes = base64.decode(base64String)
    .split('')
    .map(function (char) {
      return char.charCodeAt(0);
    });
  var hexString = '';
  for (var i = 0; i < bytes.length; i++) {
    var hex = bytes[i].toString(16);
    if (hex.length === 1) {
      hex = '0' + hex;
    }
    hexString += hex;
  }
  return hexString;
}

/**
* Asked ChatGPT / Personal Chat
* https://chat.openai.com/
* Date Accesed: 20/03/23
*/
export function stringToHexArray(inputString: string): number[] {
  const hexPairs = inputString.match(/.{1,2}/g) ?? [];
  return hexPairs.map(hexPair => parseInt(hexPair, 16));
}

/**
* Asked ChatGPT / Personal Chat
* https://chat.openai.com/
* Date Accesed: 20/03/23
*/
export function hexArrayToString(hexArray: number[]): string {
  return hexArray.map(hexNumber => hexNumber.toString(16).padStart(2, "0")).join("");
}

/**
* Asked ChatGPT / Personal Chat
* https://chat.openai.com/
* Date Accesed: 13/04/23
*/
export function convertTo2DArray(inputArray:any, rowSize:any) {
  const outputArray = [];

  for (let i = 0; i < inputArray.length; i += rowSize) {
    const row = inputArray.slice(i, i + rowSize);
    outputArray.push(row);
  }

  return outputArray;
}

/**
* Asked ChatGPT / Personal Chat
* https://chat.openai.com/
* Date Accesed: 21/03/23
*/
export function uint16ToInt16(value:any) {
  if (value & 0x8000) {
    return -((~value & 0xFFFF) + 1);
  } else {
    return value;
  }
}



  
