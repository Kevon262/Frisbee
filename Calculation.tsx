import { File } from "./File";

const FileManager = new File();

export class Calculations {
    calculateRotationalPerSecond (array:any) {
        var centripitalForceArray:any = [];
        var roundsPerSecondArray:any = [];
        var roundsPerSecondArrayFiltered:any = [];
        var roundsPerSecondCalculated = "";
        for (var i = 0; i < array.length ; i++) {
        centripitalForceArray[i] = array[i][0] + array[i][1];
        roundsPerSecondArray[i] = Math.sign(centripitalForceArray[i])*(Math.sqrt(Math.abs(centripitalForceArray[i] * 0.195 * 9.81) / 0.15) / (2*Math.PI)); 
        }
        for (var i = 0; i < array.length - 15 ; i++) {
        roundsPerSecondArrayFiltered[i] = (roundsPerSecondArray[i+0] + roundsPerSecondArray[i+1] + roundsPerSecondArray[i+2] + roundsPerSecondArray[i+3] + roundsPerSecondArray[i+4] + roundsPerSecondArray[i+5] + roundsPerSecondArray[i+6] + roundsPerSecondArray[i+7] + roundsPerSecondArray[i+8] + roundsPerSecondArray[i+9] + roundsPerSecondArray[i+10] + roundsPerSecondArray[i+11] + roundsPerSecondArray[i+12] + roundsPerSecondArray[i+13] + roundsPerSecondArray[i+14]) / 15;
        }
        roundsPerSecondCalculated = Math.max.apply(Math, roundsPerSecondArrayFiltered).toFixed(2);
        console.log("Max Rotational Speed: ", roundsPerSecondCalculated);
        return roundsPerSecondCalculated;
    }

    calculateForceOnDisc (array:any) {
        var magnitudeForceArray:any = [];
        var forceCalculated = "";
        for (var i = 0; i < 680*2; i++) {
        magnitudeForceArray[i] = Math.sqrt(((array[i][0] - array [i][1])* 0.195 / 2)**2 + ((array[i][2] - array [i][3]) * 0.195 / 2)**2);
        }
        forceCalculated = Math.max.apply(Math, magnitudeForceArray).toFixed(2);
        console.log("Max Force: ", forceCalculated);
        return forceCalculated;
    }
}