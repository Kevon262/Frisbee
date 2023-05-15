//Messages

type ErrorId = number | string;

export class Messages {

  /**
  * Asked ChatGPT / Personal Chat
  * https://chat.openai.com/
  * Date Accesed: 30/04/23
  */
  //Gives error message based on id received
  errorMessages(id: ErrorId): string | null {
    const errorMessages: { [key: string]: string } = {
      '0': 'NO_ERROR',
      '1': 'ERROR_INIT_ACC1_WHO_AM_I_TX',
      '2': 'ERROR_INIT_ACC2_WHO_AM_I_TX',
      '3': 'ERROR_INIT_ACC1_WHO_AM_I_RX',
      '4': 'ERROR_INIT_ACC2_WHO_AM_I_RX',
      '5': 'ERROR_INIT_ACC1_WHO_AM_I_NO_MATCH',
      '6': 'ERROR_INIT_ACC2_WHO_AM_I_NO_MATCH',
      '7': 'ERROR_INIT_ACC1_SET_REG_CONFIG',
      '8': 'ERROR_INIT_ACC2_SET_REG_CONFIG',
      '9': 'ERROR_ACC1_DMA_TRANSMITT',
      '10': 'ERROR_ACC2_DMA_TRANSMITT',
      '11': 'ERROR_ACC1_DMA_RECIVE',
      '12': 'ERROR_ACC2_DMA_RECIVE',
      '13': 'ERROR_ACC1_DMA_ERROR',
      '14': 'ERROR_ACC2_DMA_ERROR',
      '15': 'ERROR_ACC_IRQ_NOT_READY',
      '16': 'ERROR_RAM_TOO_SMALL',
    };
    return errorMessages[id.toString()] || null;
  }

  /**
  * Asked ChatGPT / Personal Chat
  * https://chat.openai.com/
  * Date Accesed: 30/04/23
  */
  //Returns status messages based on bits received
  statusMessages(status: number): string {
    const statusMessages: { [key: string]: string } = {
      '0': 'USB-C tilkoblet',
      '1': 'Ferdig ladet',
      '2': 'knapp har hengt seg',
      '3': 'Timer init feil',
      '4': 'ADC init feil',
      '5': 'ADC start Interrupt feil',
      '6': 'Reservert',
      '7': 'Reservert',
      '8': 'Reservert',
      '9': 'Reservert',
      '10': 'Reservert',
      '11': 'Reservert',
      '12': 'Reservert',
      '13': 'Reservert',
      '14': 'Reservert',
      '15': 'Reservert',
    };
    const result: string[] = [];
    let bitIndex = 0;
    while (status > 0) {
      if (status & 1) {
        const message = statusMessages[bitIndex.toString()];
        if (message) {
          result.push(message + ' ');
        }
      }
      status >>= 1;
      bitIndex++;
    }
    return result.join(', ');
  }
}
