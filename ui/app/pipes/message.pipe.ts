import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'messagePipe'
})
export class MessagePipe implements PipeTransform {
  
  transform(message: string): string {
    let data: any;
    try {
      data = JSON.parse(message);
    } catch(e) {
      console.log('Error parsing message:', e);
      return message;
    }
    return data.content;
  }
}