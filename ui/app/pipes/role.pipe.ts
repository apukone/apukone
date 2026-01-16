import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rolePipe'
})
export class RolePipe implements PipeTransform {
    transform(jsonString: string): string {
        try {
          const parsed = JSON.parse(jsonString);
          return parsed.role === 'user' ? 'user' : 'assistant';
        } catch (error) {
          console.error("Invalid JSON:", error);
          return '';
        }
    }
}