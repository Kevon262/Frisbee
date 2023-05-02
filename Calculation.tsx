//Calculations

import { File } from "./File";

const FileManager = new File();

export class Calculations {
  //Calculate the rotations per second
  calculateRotationsPerSecond (array:any) {
    var centripitalForceArray:any = [];
    var roundsPerSecondArray:any = [];
    var roundsPerSecondArrayFiltered:any = [];
    var roundsPerSecondCalculated = "";
    //Calculate the rounds per second
    for (var i = 0; i < array.length ; i++) {
    centripitalForceArray[i] = array[i][0] + array[i][1];
    roundsPerSecondArray[i] = Math.sign(centripitalForceArray[i])*(Math.sqrt(Math.abs(centripitalForceArray[i] * 0.195 * 9.81) / 0.15) / (2*Math.PI)); 
    }
    //Filter the RPS, to remove some noise
    for (var i = 0; i < array.length - 15 ; i++) {
    roundsPerSecondArrayFiltered[i] = (roundsPerSecondArray[i+0] + roundsPerSecondArray[i+1] + roundsPerSecondArray[i+2] + roundsPerSecondArray[i+3] + roundsPerSecondArray[i+4] + roundsPerSecondArray[i+5] + roundsPerSecondArray[i+6] + roundsPerSecondArray[i+7] + roundsPerSecondArray[i+8] + roundsPerSecondArray[i+9] + roundsPerSecondArray[i+10] + roundsPerSecondArray[i+11] + roundsPerSecondArray[i+12] + roundsPerSecondArray[i+13] + roundsPerSecondArray[i+14]) / 15;
    }
    roundsPerSecondCalculated = Math.max.apply(Math, roundsPerSecondArrayFiltered).toFixed(2);
    console.log("Max Rotational Speed: ", roundsPerSecondCalculated);
    return roundsPerSecondCalculated;
  }

  //Calculate the force on the frisbee disc, not working as expected
  calculateForceOnDisc (array:any) {
    var magnitudeForceArray:any = [];
    var forceCalculated = "";
    for (var i = 0; i < 680*2; i++) {
    magnitudeForceArray[i] = Math.sqrt(((array[i][0] - array [i][1]) * 0.195 / 2)**2 + ((array[i][2] - array [i][3]) * 0.195 / 2)**2);
    }
    forceCalculated = Math.max.apply(Math, magnitudeForceArray).toFixed(2);
    console.log("Max Force: ", forceCalculated);
    return forceCalculated;
  }

  /**
  * Asked ChatGPT
  * https://chat.openai.com/
  * Date Accesed: 026/04/23
  */
  calculateBatteryPercentage(voltage: number): number {
    const batteryPoints = [
      [0, 3.224],
      [5, 3.665],
      [10, 3.715],
      [20, 3.775],
      [30, 3.814],
      [40, 3.836],
      [50, 3.869],
      [60, 3.924],
      [70, 3.977],
      [80, 4.025],
      [90, 4.123],
      [100, 4.189],
    ];
    if (voltage <= batteryPoints[0][1]) {
      return 0;
    } else if (voltage >= batteryPoints[batteryPoints.length - 1][1]) {
      return 100;
    }
    
    // Find the battery point closest to the given voltage
    let closestPoint = batteryPoints[0];
    for (let i = 1; i < batteryPoints.length; i++) {
      const point = batteryPoints[i];
      const distance = Math.abs(point[1] - voltage);
      const closestDistance = Math.abs(closestPoint[1] - voltage);
      if (distance < closestDistance) {
        closestPoint = point;
      }
    }
    // Interpolate the battery percentage based on the closest point and the surrounding points
    const [x0, y0] = closestPoint;
    let [x1, y1] = closestPoint;
    for (let i = 0; i < batteryPoints.length; i++) {
      const point = batteryPoints[i];
      if (point[0] > x0) {
        x1 = point[0];
        y1 = point[1];
        break;
      }
    }

    // If x1 and x0 are equal (voltage is equal to the last point), return 100
    if (x1 === x0) {
      return 100;
    }

    // If voltage is equal to the last point in the batteryPoints array, return 100
    if (voltage === batteryPoints[batteryPoints.length - 1][1]) {
      return 100;
    }
    const m = (y1 - y0) / (x1 - x0);
    const b = y0 - m * x0;
    const percentage = (voltage - b) / m;
    return Math.max(0, Math.min(100, percentage));
  }
}