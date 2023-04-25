//File Management
import {convertTo2DArray} from './Convert';

const RNFS = require('react-native-fs');

export class File {

    //Gives the file the right name and path
    getFilePath(fileName:string, fileThrowID?:number | 0) {
        var filePath = '';
        if (fileName == 'Battery') {
            filePath = '/Frisbee_Data/' + fileName + '.txt';
        } else if (fileName == 'Report') {
            filePath = '/Frisbee_Data/' + fileName + '_' + fileThrowID + '.txt';
        } else if (fileName == 'Report_Array') {
            filePath = '/Frisbee_Data/' + fileName + '_' + fileThrowID + '.txt';
        } else {
            filePath = '/Frisbee_Data/' + fileName + '.txt';
        }
        return filePath;
    }

    //Check if folder existst, if not create new folder. Also if file exists delete it. 
    async checkForFile(filePath:string) {
        const folderPath = RNFS.DownloadDirectoryPath + '/Frisbee_Data';
        try {
            if (await RNFS.exists(folderPath)) {
                console.log('Folder Exists');
            } else {
                RNFS.mkdir(folderPath);
                console.warn('Folder Missing, Creating New ');
            }
            if (RNFS.exists(filePath)) {
                RNFS.unlink(filePath) 
                .then(() => {
                    console.warn(filePath + ' Exists, Deleting ');
                })
                .catch((error:any) => {
                    console.log(error.message);
                });
            } 
        } catch (error) {
            console.error(error);
        }
    }

    writeToFile(input:any, filePath:string) {
        var Path = RNFS.DownloadDirectoryPath + filePath;
        if (RNFS.exists(Path)){
            RNFS.appendFile(Path, input + '\n', 'utf8')
            .then((success:any) => {
                console.log('Appended Data to File: ', Path);
            })
            .catch((error:any) => {
                console.error(error.message);
            }); 
        } else {
            RNFS.writeFile(Path, input + '\n', 'utf8')
            .then((success:any) => {
                console.log('Writing Data to File: ', Path);
            })
            .catch((error:any) => {
                console.error(error.message);
            });
        }
    }

    readTheDamFile(fileThrowID: number): Promise<any> {
        const pathFile = RNFS.DownloadDirectoryPath + '/Frisbee_Data/Report_' + fileThrowID + '.txt';
        return new Promise((resolve, reject) => {
          RNFS.readFile(pathFile, 'utf8')
            .then((success: any) => {
              resolve(success);
            })
            .catch((error: any) => {
              console.error(error.message);
              reject(error);
            });
        });
      }


    //Read Data from File
    async readDataFromFile(fileThrowID:number) {
        try {
        var jsonArrayData = await this.readTheDamFile(fileThrowID);
        var jsonArray = JSON.parse("[" + jsonArrayData + "]");
        } catch (error) {
        console.error(error);
        }
        var jsonArray2D = convertTo2DArray(jsonArray, 4);
        console.log(jsonArray2D);
    }
}